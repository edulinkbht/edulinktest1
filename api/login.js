export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.status(200).json({
    apiKey: "AIzaSyAJH79UQl0rc96Qug0DKLevO4ZI_sn8Kno",
    authDomain: "edulinki.firebaseapp.com",
    projectId: "edulinki",
    storageBucket: "edulinki.firebasestorage.app",
    messagingSenderId: "248886466474",
    appId: "1:248886466474:web:160043201a6b28bafbbdd3"
  });
}
