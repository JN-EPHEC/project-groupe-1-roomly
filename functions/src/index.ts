// functions/src/index.ts

import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
// ⬇️⬇️ IMPORTANT : utiliser l'import par défaut
import sgMail from "@sendgrid/mail";

admin.initializeApp();

// ================================
// 🔑 Config SendGrid (SIMPLE)
// ================================
// ⚠️ Mets ici ta vraie clé SendGrid et ton email "from"
const SENDGRID_KEY = "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"; // ex: "SG...."
const SENDGRID_FROM = "no-reply@roomly.be";

sgMail.setApiKey(SENDGRID_KEY);

/**
 * 📧 Fonction déclenchée à chaque nouvelle réservation.
 * Trigger : création d'un document dans "reservations/{reservationId}"
 */
export const sendReservationConfirmationEmail = functions.firestore
  .document("reservations/{reservationId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() as any;

    if (!data) {
      console.log("Pas de données dans le document, on annule.");
      return;
    }

    const email = data.userEmail || data.email || null;
    const userName = data.userName || "Client Roomly";
    const date = data.date || "";
    const slots = Array.isArray(data.slots) ? data.slots.join(", ") : "";
    const total = data.total ?? "-";

    if (!email) {
      console.log(
        "Aucune adresse email dans la réservation, email non envoyé."
      );
      return;
    }

    const msg: sgMail.MailDataRequired = {
      to: email,
      from: SENDGRID_FROM,
      subject: "Confirmation de votre réservation Roomly",
      html: `
        <p>Bonjour ${userName},</p>
        <p>Merci pour votre réservation sur <strong>Roomly</strong>.</p>
        <p><strong>Date :</strong> ${date}</p>
        <p><strong>Créneaux :</strong> ${slots}</p>
        <p><strong>Total :</strong> ${total} €</p>
        <p>Vous pouvez retrouver tous les détails de votre réservation dans l’application Roomly.</p>
        <p>À bientôt,<br/>L'équipe Roomly</p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log("📧 Email de confirmation envoyé à", email);
    } catch (err: any) {
      console.error("Erreur lors de l’envoi de l’email SendGrid :", err);
      if (err.response?.body) {
        console.error(
            "Détail SendGrid :",
            JSON.stringify(err.response.body, null, 2)
        );
      }
    }
  });
