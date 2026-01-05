// utils/adminLogs.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export type AdminActionType =
  | "ticket_status_change"
  | "space_status_change"
  | "review_moderation"
  | "coupon_change"
  | "user_change"
  | "other";

type LogParams = {
  actionType: AdminActionType;
  targetType: string;      // ex: "supportTicket", "espace", "avis", "coupon"
  targetId?: string | null;
  description: string;     // texte lisible dans l’historique
  meta?: any;              // infos complémentaires (ancien/nouveau statut, email, etc.)
};

export async function logAdminAction({
  actionType,
  targetType,
  targetId,
  description,
  meta,
}: LogParams) {
  const admin = auth.currentUser;

  await addDoc(collection(db, "adminLogs"), {
    actionType,
    targetType,
    targetId: targetId || null,
    description,
    meta: meta || null,
    adminId: admin?.uid || null,
    adminEmail: admin?.email || null,
    createdAt: serverTimestamp(),
  });
}
