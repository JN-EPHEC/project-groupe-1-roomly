// functions/src/index.ts

import sgMail from "@sendgrid/mail";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

admin.initializeApp();

// Secret défini côté Firebase (PAS dans le code)
const SENDGRID_KEY = defineSecret("SENDGRID_API_KEY");

// Adresse d’expéditeur
const SENDGRID_FROM = "no-reply@roomly.be";

// =====================================================
// 📧 Envoi d'un mail à chaque nouvelle réservation
// =====================================================
export const sendReservationConfirmationEmail = onDocumentCreated(
  {
    document: "reservations/{reservationId}", // chemin Firestore
    region: "us-central1",
    secrets: [SENDGRID_KEY],
  },
  // ⚠️ 2e argument uniquement = le handler
  async (event: any) => {
    const snap = event.data;
    if (!snap) {
      console.log("Pas de document, on annule.");
      return;
    }

    const data = snap.data() as any;

    const email = data.userEmail || data.email || null;
    const userName = data.userName || "Client Roomly";
    const date = data.date || "";
    const slots = Array.isArray(data.slots) ? data.slots.join(", ") : "";
    const total = data.total ?? "-";

    if (!email) {
      console.log("Aucun email trouvé → pas d’envoi");
      return;
    }

    // Récupère la clé secrète définie dans Firebase
    sgMail.setApiKey(SENDGRID_KEY.value());

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
      console.log("📧 Email envoyé à", email);
    } catch (err: any) {
      console.error("Erreur lors de l’envoi de l’email SendGrid :", err);
      if (err.response?.body) {
        console.error("Détail SendGrid :", JSON.stringify(err.response.body));
      }
    }
  }
);
