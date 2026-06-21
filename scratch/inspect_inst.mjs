import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-XUdQYRvfApxbMOi6hWdf0GC_OVHIciE",
  authDomain: "sistemadeplanillas.firebaseapp.com",
  projectId: "sistemadeplanillas",
  storageBucket: "sistemadeplanillas.firebasestorage.app",
  messagingSenderId: "128567308362",
  appId: "1:128567308362:web:f0a782a56b3909071e76b3",
  measurementId: "G-QM9BV5Q9B9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectInstitutionalPlanilla() {
  const d = await getDoc(doc(db, "planillas", "9Yiyqs3StJCF8votsi6z"));
  if (d.exists()) {
    console.log(JSON.stringify(d.data(), null, 2));
  } else {
    console.log("Not found");
  }
}

inspectInstitutionalPlanilla().catch(console.error);
