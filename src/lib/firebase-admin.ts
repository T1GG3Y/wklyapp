let adminDb: any = null;

export async function getAdminFirestore() {
  if (adminDb) return adminDb;

  const { initializeApp, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-8976664643-fedc8',
    });
  }

  adminDb = getFirestore();
  return adminDb;
}
