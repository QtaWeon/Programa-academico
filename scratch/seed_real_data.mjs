import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, addDoc, writeBatch } from "firebase/firestore";

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

async function clearCollection(collectionName, keepFilter = () => false) {
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  let count = 0;
  snapshot.docs.forEach((d) => {
    if (!keepFilter(d.data(), d.id)) {
      batch.delete(d.ref);
      count++;
    }
  });
  if (count > 0) await batch.commit();
  console.log(`Cleared ${count} docs from ${collectionName}`);
}

const studentData = [
  { f: "JESÚS ALEJANDRO", l: "ALDERETE VILLAMAYOR", ci: "5.000.001", active: true, months: [2, 3, 4, 5] },
  { f: "THOMAS ALEXANDER", l: "ALEGRE CHÁVEZ", ci: "5.000.002", active: true, months: [2, 3, 4, 5] },
  { f: "LUCAS GABRIEL", l: "ARBIZA CORONEL", ci: "5.000.003", active: true, months: [2, 3, 4, 5] },
  { f: "BRANDON MATEO", l: "BÁEZ ACOSTA", ci: "5.000.004", active: true, months: [2, 3, 4, 5] },
  { f: "ALEJANDRO GABRIEL", l: "BELLO ESTIGARRIBIA", ci: "5.000.005", active: true, months: [2, 3, 4, 5] },
  { f: "GABRIELA MARÍA LUJÁN", l: "BENÍTEZ FRETES", ci: "5.000.006", active: true, months: [2, 3, 4, 5] },
  { f: "ROCIO MADELEIN", l: "CARDOZO BÁEZ", ci: "5.000.007", active: true, months: [2, 3, 4, 5] },
  { f: "TOBIAS DANIEL", l: "DELVALLE BENITEZ", ci: "5.000.008", active: true, months: [2, 3, 4, 5] },
  { f: "CRISTHIAN FACUNDO", l: "GONZÁLEZ CAMARAZA", ci: "5.000.009", active: true, months: [2, 3, 4, 5] },
  { f: "ALEX FABIÁN", l: "GONZÁLEZ ESPILLAGA", ci: "5.000.010", active: true, months: [2, 3, 4, 5] },
  { f: "ALEJANDRO DANIEL", l: "GONZÁLEZ SCHULTZ", ci: "5.000.011", active: true, months: [2, 3, 4, 5] },
  { f: "MICHAEL ALBERTO", l: "IORDANOV CABALLERO", ci: "5.000.012", active: true, months: [2, 3, 4, 5] },
  { f: "MARIA CELINA", l: "IRIARTE DIAZ", ci: "5.000.013", active: true, months: [2, 3, 4, 5] },
  { f: "SEBASTIÁN", l: "LÓPEZ GIMÉNEZ", ci: "5.000.014", active: true, months: [2, 3, 4, 5] },
  { f: "EZEQUIEL", l: "MARTINEZ CAMARASA", ci: "5.000.015", active: true, months: [2, 3, 4, 5] },
  { f: "PABLO SEBASTIÁN", l: "MEDINA GARCETE", ci: "5.000.016", active: true, months: [2, 3, 4, 5] },
  { f: "TOBIAS MARCELO", l: "MELGAREJO LEDESMA", ci: "5.000.017", active: true, months: [2, 3, 4, 5] },
  { f: "ALEX RICARDO", l: "MEZA VÁZQUEZ", ci: "5.000.018", active: true, months: [2, 3, 4, 5] },
  { f: "DENIS EMMANUEL", l: "MORALES TRINIDAD", ci: "5.000.019", active: true, months: [2, 3, 4, 5] },
  { f: "EMILY SAMANTHA", l: "NAKAMORI TERABAYASHI", ci: "5.000.020", active: true, months: [2, 3, 4, 5] },
  { f: "THIAGO LUIS", l: "NÚÑEZ ÁLBAREZ", ci: "5.000.021", active: true, months: [2, 3, 4, 5] },
  { f: "ALEX SANTIAGO", l: "ORTIZ GAUTO", ci: "5.000.022", active: true, months: [2, 3, 4, 5] },
  { f: "ÁNGELES BEGOÑA", l: "PERALTA RAMÍREZ", ci: "5.000.023", active: false, months: [2] }, // left in March
  { f: "KIARA MAGALI", l: "PEZOA MERELES", ci: "5.000.024", active: true, months: [2, 3, 4, 5] },
  { f: "GIOVANNI FABIÁN", l: "PORTILLO ESQUIVEL", ci: "5.000.025", active: true, months: [2, 3, 4, 5] },
  { f: "FABRIZZIO GABRIEL", l: "RAMIREZ ESCOBAR", ci: "5.000.026", active: true, months: [2, 3, 4, 5] },
  { f: "DANNA REBECA", l: "RIVEROS AGUILERA", ci: "5.000.027", active: true, months: [2, 3, 4, 5] },
  { f: "AXEL DANIEL", l: "RODRIGUEZ VIVEROS", ci: "5.000.028", active: true, months: [2, 3, 4, 5] },
  { f: "ANA PAULA", l: "RUIZ DIAZ FERREIRA", ci: "5.000.029", active: true, months: [2, 3, 4, 5] },
  { f: "PEDRO EDUARDO", l: "RUIZ DURÉ", ci: "5.000.030", active: true, months: [2, 3, 4, 5] },
  { f: "FACUNDO ISMAEL", l: "SALDIVAR REYES", ci: "5.000.031", active: true, months: [2, 3, 4, 5] },
  { f: "LISSETTE ESTEFANÍA", l: "VILLALBA ORTIZ", ci: "5.000.032", active: true, months: [2, 3, 4, 5] },
  { f: "DINA MARICRIS", l: "ZARACHO AQUINO", ci: "5.000.033", active: true, months: [3, 4, 5] }
];

const subjects = [
  "Lengua Castellana y Literatura",
  "Ciencias Naturales y Salud",
  "Matemática",
  "Historia y Geografía",
  "Economía y Gestión",
  "Psicología",
  "Educación Física",
  "Orientación Educacional y Sociolaboral",
  "Gabinete de Informática Laboratorio",
  "Algorítmica",
  "Administración Financiera",
  "Matemática Aplicada a la Informática",
  "Plan Optativo Cooperativismo"
];

const tps = {
  2: { "Lengua Castellana y Literatura": 8, "Ciencias Naturales y Salud": 4, "Matemática": 8, "Historia y Geografía": 6, "Economía y Gestión": 8, "Psicología": 8, "Educación Física": 4, "Orientación Educacional y Sociolaboral": 4, "Gabinete de Informática Laboratorio": 8, "Algorítmica": 8, "Administración Financiera": 8, "Matemática Aplicada a la Informática": 8, "Plan Optativo Cooperativismo": 12 },
  3: { "Lengua Castellana y Literatura": 14, "Ciencias Naturales y Salud": 8, "Matemática": 16, "Historia y Geografía": 10, "Economía y Gestión": 20, "Psicología": 16, "Educación Física": 8, "Orientación Educacional y Sociolaboral": 8, "Gabinete de Informática Laboratorio": 16, "Algorítmica": 16, "Administración Financiera": 16, "Matemática Aplicada a la Informática": 16, "Plan Optativo Cooperativismo": 14 },
  4: { "Lengua Castellana y Literatura": 12, "Ciencias Naturales y Salud": 6, "Matemática": 12, "Historia y Geografía": 8, "Economía y Gestión": 16, "Psicología": 16, "Educación Física": 6, "Orientación Educacional y Sociolaboral": 8, "Gabinete de Informática Laboratorio": 16, "Algorítmica": 16, "Administración Financiera": 12, "Matemática Aplicada a la Informática": 16, "Plan Optativo Cooperativismo": 10 },
  5: { "Lengua Castellana y Literatura": 8, "Ciencias Naturales y Salud": 6, "Matemática": 12, "Historia y Geografía": 8, "Economía y Gestión": 16, "Psicología": 12, "Educación Física": 6, "Orientación Educacional y Sociolaboral": 6, "Gabinete de Informática Laboratorio": 18, "Algorítmica": 8, "Administración Financiera": 12, "Matemática Aplicada a la Informática": 16, "Plan Optativo Cooperativismo": 10 }
};

const febExceptions = {
  "Matemática": {
    "BÁEZ ACOSTA, BRANDON MATEO": 4,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 7,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 2,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 4,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 7,
    "MORALES TRINIDAD, DENIS EMMANUEL": 3,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 4
  },
  "Lengua Castellana y Literatura": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 0,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "RIVEROS AGUILERA, DANNA REBECA": 0
  },
  "Ciencias Naturales y Salud": {
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0
  },
  "Historia y Geografía": {
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 2,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0
  },
  "Economía y Gestión": {
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 4
  },
  "Psicología": {
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0
  },
  "Orientación Educacional y Sociolaboral": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 2,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 2,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 2,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 4
  },
  "Educación Física": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 2,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0
  },
  "Gabinete de Informática Laboratorio": {
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0
  },
  "Algorítmica": {
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 4,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0
  },
  "Administración Financiera": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 6,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 6,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0
  },
  "Matemática Aplicada a la Informática": {
    "BÁEZ ACOSTA, BRANDON MATEO": 4,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 4,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 0,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 6,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 6,
    "IRIARTE DIAZ, MARIA CELINA": 6,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "MORALES TRINIDAD, DENIS EMMANUEL": 4,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 0,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 0
  },
  "Plan Optativo Cooperativismo": {
    "BÁEZ ACOSTA, BRANDON MATEO": 10,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 8,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 6,
    "PERALTA RAMÍREZ, ÁNGELES BEGOÑA": 0,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0
  }
};

const marExceptions = {
  "Lengua Castellana y Literatura": {
    "BÁEZ ACOSTA, BRANDON MATEO": 12,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 12
  },
  "Ciencias Naturales y Salud": {
    "BÁEZ ACOSTA, BRANDON MATEO": 5
  },
  "Matemática": {
    "BÁEZ ACOSTA, BRANDON MATEO": 12,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 12,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 12,
    "MORALES TRINIDAD, DENIS EMMANUEL": 4
  },
  "Historia y Geografía": {
    "BÁEZ ACOSTA, BRANDON MATEO": 8,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 8,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 8
  },
  "Economía y Gestión": {
    "BÁEZ ACOSTA, BRANDON MATEO": 0,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 0,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 0,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 16,
    "MORALES TRINIDAD, DENIS EMMANUEL": 0
  },
  "Psicología": {
    "BÁEZ ACOSTA, BRANDON MATEO": 12
  },
  "Educación Física": {
    "BÁEZ ACOSTA, BRANDON MATEO": 5,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 4,
    "MARTINEZ CAMARASA, EZEQUIEL": 7
  },
  "Orientación Educacional y Sociolaboral": {
    "BÁEZ ACOSTA, BRANDON MATEO": 7,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 4,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 7
  },
  "Algorítmica": {
    "BÁEZ ACOSTA, BRANDON MATEO": 12,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 8,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 12,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 12,
    "MARTINEZ CAMARASA, EZEQUIEL": 12,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 12,
    "ZARACHO AQUINO, DINA MARICRIS": 12
  },
  "Matemática Aplicada a la Informática": {
    "BÁEZ ACOSTA, BRANDON MATEO": 12,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 4,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 8,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 14,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 12,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 12
  },
  "Plan Optativo Cooperativismo": {
    "BÁEZ ACOSTA, BRANDON MATEO": 9,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 12,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 10,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 13,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 12,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 12
  }
};

const aprExceptions = {
  "Matemática": {
    "BÁEZ ACOSTA, BRANDON MATEO": 10,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 11,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 10,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 6,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 6,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 8,
    "MORALES TRINIDAD, DENIS EMMANUEL": 4,
    "ORTIZ GAUTO, ALEX SANTIAGO": 10,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 10,
    "RIVEROS AGUILERA, DANNA REBECA": 11,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 11,
    "RUIZ DURÉ, PEDRO EDUARDO": 10,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 10
  },
  "Historia y Geografía": {
    "ALDERETE VILLAMAYOR, JESÚS ALEJANDRO": 7,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 6,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 6
  },
  "Economía y Gestión": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 14,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 0,
    "MARTINEZ CAMARASA, EZEQUIEL": 14,
    "MORALES TRINIDAD, DENIS EMMANUEL": 8,
    "RUIZ DURÉ, PEDRO EDUARDO": 14
  },
  "Orientación Educacional y Sociolaboral": {
    "BÁEZ ACOSTA, BRANDON MATEO": 6,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 6,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 6,
    "MARTINEZ CAMARASA, EZEQUIEL": 6,
    "ZARACHO AQUINO, DINA MARICRIS": 6
  },
  "Algorítmica": {
    "CARDOZO BÁEZ, ROCIO MADELEIN": 14,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 4,
    "MARTINEZ CAMARASA, EZEQUIEL": 12,
    "ORTIZ GAUTO, ALEX SANTIAGO": 12
  },
  "Matemática Aplicada a la Informática": {
    "BÁEZ ACOSTA, BRANDON MATEO": 15,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 12,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 14,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 4,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 12,
    "MORALES TRINIDAD, DENIS EMMANUEL": 12,
    "ORTIZ GAUTO, ALEX SANTIAGO": 15,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 14,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 15
  },
  "Plan Optativo Cooperativismo": {
    "BÁEZ ACOSTA, BRANDON MATEO": 6,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 8,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 6,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 8
  },
  "Educación Física": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 5,
    "ZARACHO AQUINO, DINA MARICRIS": 5
  }
};

const mayExceptions = {
  "Ciencias Naturales y Salud": {
    "BÁEZ ACOSTA, BRANDON MATEO": 5,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 5,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 4,
    "ZARACHO AQUINO, DINA MARICRIS": 4
  },
  "Matemática": {
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 10,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 10,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 10,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 3,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 8,
    "MORALES TRINIDAD, DENIS EMMANUEL": 0,
    "PEZOA MERELES, KIARA MAGALI": 10,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 10,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 9,
    "RIVEROS AGUILERA, DANNA REBECA": 10,
    "RUIZ DURÉ, PEDRO EDUARDO": 10,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 8,
    "ZARACHO AQUINO, DINA MARICRIS": 10
  },
  "Economía y Gestión": {
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 0,
    "MORALES TRINIDAD, DENIS EMMANUEL": 0,
    "ORTIZ GAUTO, ALEX SANTIAGO": 8
  },
  "Psicología": {
    "BÁEZ ACOSTA, BRANDON MATEO": 8,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 10,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 11,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 8,
    "ZARACHO AQUINO, DINA MARICRIS": 9
  },
  "Educación Física": {
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 5,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 5,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 2,
    "ZARACHO AQUINO, DINA MARICRIS": 4
  },
  "Orientación Educacional y Sociolaboral": {
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 4,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 4,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 4,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 4,
    "RUIZ DURÉ, PEDRO EDUARDO": 2,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 2,
    "ZARACHO AQUINO, DINA MARICRIS": 4
  },
  "Gabinete de Informática Laboratorio": {
    "ZARACHO AQUINO, DINA MARICRIS": 17
  },
  "Administración Financiera": {
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 11,
    "RUIZ DURÉ, PEDRO EDUARDO": 11,
    "ZARACHO AQUINO, DINA MARICRIS": 8
  },
  "Matemática Aplicada a la Informática": {
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 14,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 13,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 11,
    "IORDANOV CABALLERO, MICHAEL ALBERTO": 15,
    "IRIARTE DIAZ, MARIA CELINA": 15,
    "MORALES TRINIDAD, DENIS EMMANUEL": 15,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 15,
    "RIVEROS AGUILERA, DANNA REBECA": 14,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 10,
    "ZARACHO AQUINO, DINA MARICRIS": 12
  },
  "Plan Optativo Cooperativismo": {
    "DELVALLE BENITEZ, TOBIAS DANIEL": 4,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 6,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 8,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 8
  }
};

const partialExams = {
  "Matemática": {
    "ALDERETE VILLAMAYOR, JESÚS ALEJANDRO": 12,
    "ALEGRE CHÁVEZ, THOMAS ALEXANDER": 9,
    "ARBIZA CORONEL, LUCAS GABRIEL": 12,
    "BÁEZ ACOSTA, BRANDON MATEO": 8,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 10,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 12,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 8,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 1,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 9,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 8,
    "GONZÁLEZ SCHULTZ, ALEJANDRO DANIEL": 12,
    "IORDANOV CABALLERO, MICHAEL ALBERTO": 6,
    "IRIARTE DIAZ, MARIA CELINA": 5,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 9,
    "MARTINEZ CAMARASA, EZEQUIEL": 4,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 12,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 0,
    "MEZA VÁZQUEZ, ALEX RICARDO": 8,
    "MORALES TRINIDAD, DENIS EMMANUEL": 5,
    "NAKAMORI TERABAYASHI, EMILY SAMANTHA": 12,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 10,
    "ORTIZ GAUTO, ALEX SANTIAGO": 1,
    "PEZOA MERELES, KIARA MAGALI": 10,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 9,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 6,
    "RIVEROS AGUILERA, DANNA REBECA": 11,
    "RODRIGUEZ VIVEROS, AXEL DANIEL": 7,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 12,
    "RUIZ DURÉ, PEDRO EDUARDO": 3,
    "SALDIVAR REYES, FACUNDO ISMAEL": 9,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 12,
    "ZARACHO AQUINO, DINA MARICRIS": 0
  },
  "Economía y Gestión": {
    "ALDERETE VILLAMAYOR, JESÚS ALEJANDRO": 10,
    "ALEGRE CHÁVEZ, THOMAS ALEXANDER": 8,
    "ARBIZA CORONEL, LUCAS GABRIEL": 10,
    "BÁEZ ACOSTA, BRANDON MATEO": 5,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 6,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 7,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 6,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 2,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 3,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 4,
    "GONZÁLEZ SCHULTZ, ALEJANDRO DANIEL": 11,
    "IORDANOV CABALLERO, MICHAEL ALBERTO": 3,
    "IRIARTE DIAZ, MARIA CELINA": 7,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 9,
    "MARTINEZ CAMARASA, EZEQUIEL": 5,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 8,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 6,
    "MEZA VÁZQUEZ, ALEX RICARDO": 5,
    "MORALES TRINIDAD, DENIS EMMANUEL": 3,
    "NAKAMORI TERABAYASHI, EMILY SAMANTHA": 8,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 6,
    "ORTIZ GAUTO, ALEX SANTIAGO": 3,
    "PEZOA MERELES, KIARA MAGALI": 3,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 7,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 6,
    "RIVEROS AGUILERA, DANNA REBECA": 9,
    "RODRIGUEZ VIVEROS, AXEL DANIEL": 5,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 8,
    "RUIZ DURÉ, PEDRO EDUARDO": 4,
    "SALDIVAR REYES, FACUNDO ISMAEL": 11,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 9,
    "ZARACHO AQUINO, DINA MARICRIS": 5
  },
  "Plan Optativo Cooperativismo": {
    "ALDERETE VILLAMAYOR, JESÚS ALEJANDRO": 10,
    "ALEGRE CHÁVEZ, THOMAS ALEXANDER": 12,
    "ARBIZA CORONEL, LUCAS GABRIEL": 10,
    "BÁEZ ACOSTA, BRANDON MATEO": 10,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 6,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 11,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 11,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 3,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 3,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 5,
    "GONZÁLEZ SCHULTZ, ALEJANDRO DANIEL": 11,
    "IORDANOV CABALLERO, MICHAEL ALBERTO": 7,
    "IRIARTE DIAZ, MARIA CELINA": 10,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 9,
    "MARTINEZ CAMARASA, EZEQUIEL": 6,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 7,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 5,
    "MEZA VÁZQUEZ, ALEX RICARDO": 6,
    "MORALES TRINIDAD, DENIS EMMANUEL": 2,
    "NAKAMORI TERABAYASHI, EMILY SAMANTHA": 10,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 11,
    "ORTIZ GAUTO, ALEX SANTIAGO": 7,
    "PEZOA MERELES, KIARA MAGALI": 4,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 10,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 7,
    "RIVEROS AGUILERA, DANNA REBECA": 9,
    "RODRIGUEZ VIVEROS, AXEL DANIEL": 11,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 10,
    "RUIZ DURÉ, PEDRO EDUARDO": 7,
    "SALDIVAR REYES, FACUNDO ISMAEL": 12,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 10,
    "ZARACHO AQUINO, DINA MARICRIS": 4
  },
  "Administración Financiera": {
    "ALDERETE VILLAMAYOR, JESÚS ALEJANDRO": 11,
    "ALEGRE CHÁVEZ, THOMAS ALEXANDER": 11,
    "ARBIZA CORONEL, LUCAS GABRIEL": 11,
    "BÁEZ ACOSTA, BRANDON MATEO": 7,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 7,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 11,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 9,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 8,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 8,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 6,
    "GONZÁLEZ SCHULTZ, ALEJANDRO DANIEL": 12,
    "IORDANOV CABALLERO, MICHAEL ALBERTO": 10,
    "IRIARTE DIAZ, MARIA CELINA": 11,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 11,
    "MARTINEZ CAMARASA, EZEQUIEL": 11,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 9,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 10,
    "MEZA VÁZQUEZ, ALEX RICARDO": 8,
    "MORALES TRINIDAD, DENIS EMMANUEL": 10,
    "NAKAMORI TERABAYASHI, EMILY SAMANTHA": 11,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 12,
    "ORTIZ GAUTO, ALEX SANTIAGO": 8,
    "PEZOA MERELES, KIARA MAGALI": 10,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 10,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 11,
    "RIVEROS AGUILERA, DANNA REBECA": 9,
    "RODRIGUEZ VIVEROS, AXEL DANIEL": 10,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 11,
    "RUIZ DURÉ, PEDRO EDUARDO": 11,
    "SALDIVAR REYES, FACUNDO ISMAEL": 11,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 9,
    "ZARACHO AQUINO, DINA MARICRIS": 6
  },
  "Gabinete de Informática Laboratorio": {
    "ALDERETE VILLAMAYOR, JESÚS ALEJANDRO": 12,
    "ALEGRE CHÁVEZ, THOMAS ALEXANDER": 9,
    "ARBIZA CORONEL, LUCAS GABRIEL": 11,
    "BÁEZ ACOSTA, BRANDON MATEO": 9,
    "BELLO ESTIGARRIBIA, ALEJANDRO GABRIEL": 9,
    "BENÍTEZ FRETES, GABRIELA MARÍA LUJÁN": 10,
    "CARDOZO BÁEZ, ROCIO MADELEIN": 7,
    "DELVALLE BENITEZ, TOBIAS DANIEL": 7,
    "GONZÁLEZ CAMARAZA, CRISTHIAN FACUNDO": 7,
    "GONZÁLEZ ESPILLAGA, ALEX FABIÁN": 8,
    "GONZÁLEZ SCHULTZ, ALEJANDRO DANIEL": 11,
    "IORDANOV CABALLERO, MICHAEL ALBERTO": 7,
    "IRIARTE DIAZ, MARIA CELINA": 8,
    "LÓPEZ GIMÉNEZ, SEBASTIÁN": 10,
    "MARTINEZ CAMARASA, EZEQUIEL": 3,
    "MEDINA GARCETE, PABLO SEBASTIÁN": 10,
    "MELGAREJO LEDESMA, TOBIAS MARCELO": 5,
    "MEZA VÁZQUEZ, ALEX RICARDO": 9,
    "MORALES TRINIDAD, DENIS EMMANUEL": 7,
    "NAKAMORI TERABAYASHI, EMILY SAMANTHA": 11,
    "NÚÑEZ ÁLBAREZ, THIAGO LUIS": 8,
    "ORTIZ GAUTO, ALEX SANTIAGO": 5,
    "PEZOA MERELES, KIARA MAGALI": 7,
    "PORTILLO ESQUIVEL, GIOVANNI FABIÁN": 11,
    "RAMIREZ ESCOBAR, FABRIZZIO GABRIEL": 5,
    "RIVEROS AGUILERA, DANNA REBECA": 9,
    "RODRIGUEZ VIVEROS, AXEL DANIEL": 10,
    "RUIZ DIAZ FERREIRA, ANA PAULA": 11,
    "RUIZ DURÉ, PEDRO EDUARDO": 3,
    "SALDIVAR REYES, FACUNDO ISMAEL": 9,
    "VILLALBA ORTIZ, LISSETTE ESTEFANÍA": 8,
    "ZARACHO AQUINO, DINA MARICRIS": 0
  }
};

const monthExceptionsMap = {
  2: febExceptions,
  3: marExceptions,
  4: aprExceptions,
  5: mayExceptions
};

async function seed() {
  console.log("Starting DB Reseed with Official Data...");

  // 1. Clear Firestore collections (keeping administrator)
  await clearCollection("users", (data) => data.email === "11111@cpcc.com");
  await clearCollection("courses");
  await clearCollection("planillas");

  // 2. Create Coordinator Account
  const coordRef = await addDoc(collection(db, "users"), {
    firstName: "CARLOS",
    lastName: "GARCÍA MENDIETA",
    ci: "2.222.222",
    email: "2222222@cpcc.com",
    role: "coordinador",
    status: "activo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const coordId = coordRef.id;
  console.log(`Created Coordinator: Carlos García Mendieta (ID: ${coordId})`);

  // 3. Create 10 Teachers
  const teacherNames = [
    { f: "JUAN", l: "GÓMEZ" }, { f: "MARÍA", l: "RODRÍGUEZ" }, 
    { f: "LUIS", l: "BENÍTEZ" }, { f: "ANA", l: "FERREIRA" },
    { f: "CARLOS", l: "GONZÁLEZ" }, { f: "ELENA", l: "PÉREZ" },
    { f: "DIEGO", l: "MARTÍNEZ" }, { f: "LAURA", l: "ROMERO" },
    { f: "OSCAR", l: "DUARTE" }, { f: "ROSA", l: "SILVA" }
  ];
  const teachers = [];
  for (let i = 0; i < teacherNames.length; i++) {
    const tRef = await addDoc(collection(db, "users"), {
      firstName: teacherNames[i].f,
      lastName: teacherNames[i].l,
      ci: `3.300.00${i}`,
      email: `330000${i}@cpcc.com`,
      role: "docente",
      status: "activo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    teachers.push({ id: tRef.id, name: `${teacherNames[i].l}, ${teacherNames[i].f}` });
  }
  console.log(`Created ${teachers.length} Teachers.`);

  // 4. Create Students and capture their IDs
  const studentMap = {}; // "l, f" -> id
  for (const s of studentData) {
    const cleanCI = s.ci.replace(/\./g, '');
    const sRef = await addDoc(collection(db, "users"), {
      firstName: s.f,
      lastName: s.l,
      ci: s.ci,
      email: `${cleanCI}@cpcc.com`,
      role: "alumno",
      grade: "3° Año",
      status: s.active ? "activo" : "inactivo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    studentMap[`${s.l}, ${s.f}`] = sRef.id;
  }
  console.log(`Created ${studentData.length} Student accounts.`);

  // 5. Create Course "3° Año - Bachillerato Técnico en Informática"
  // Assign teachers to subjects
  const teacherAssignments = subjects.map((subjectName, idx) => {
    // Distribute subjects to teachers
    const assignedTeacher = teachers[idx % teachers.length];
    return {
      id: `${coordId.substring(0, 3)}-sub-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      subjectName,
      teacherId: assignedTeacher.id
    };
  });

  // Filter students who are active in the current course (i.e. those with active status)
  const activeStudentIds = studentData.filter(s => s.active).map(s => studentMap[`${s.l}, ${s.f}`]);

  const courseRef = await addDoc(collection(db, "courses"), {
    name: "Bachillerato Técnico en Informática",
    grade: "3° Año",
    year: 2026,
    coordinatorId: coordId,
    students: activeStudentIds,
    teachers: Array.from(new Set(teacherAssignments.map(a => a.teacherId))),
    teacherAssignments: teacherAssignments,
    subjects: subjects,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const courseId = courseRef.id;
  console.log(`Created Course: 3° Año - BTI (ID: ${courseId})`);

  // 6. Create Monthly Planillas (Months 2, 3, 4, 5)
  for (const month of [2, 3, 4, 5]) {
    const monthName = ["Enero", "Febrero", "Marzo", "Abril", "Mayo"][month - 1] || `${month}`;
    console.log(`Generating planillas for ${monthName} (Month ${month})...`);

    // Get the list of students present in the course during this specific month
    const presentStudents = studentData.filter(s => s.months.includes(month));

    for (const assignment of teacherAssignments) {
      const teacher = teachers.find(t => t.id === assignment.teacherId);
      const subjectName = assignment.subjectName;

      // Determine tasks array
      const maxPts = tps[month][subjectName];
      const tasks = [
        { id: "t1", name: `Proceso ${monthName}`, maxPoints: maxPts }
      ];

      // Add "Examen Parcial" if month is May (5) and subject is one of the 5 evaluated subjects
      const isPartialExamSubject = month === 5 && partialExams[subjectName] !== undefined;
      if (isPartialExamSubject) {
        tasks.push({ id: "t2", name: "Examen Parcial", maxPoints: 12 });
      }

      // Generate scores for all present students
      const scores = presentStudents.map(student => {
        const studentKey = `${student.l}, ${student.f}`;
        const studentId = studentMap[studentKey];
        const studentScores = {};

        // 1. Task 1: Proceso score
        const monthExceptions = monthExceptionsMap[month][subjectName] || {};
        if (monthExceptions[studentKey] !== undefined) {
          studentScores["t1"] = monthExceptions[studentKey];
        } else {
          studentScores["t1"] = maxPts; // Default to maximum points
        }

        // 2. Task 2: Examen Parcial score (only for evaluated subjects in May)
        if (isPartialExamSubject) {
          const examScores = partialExams[subjectName] || {};
          if (examScores[studentKey] !== undefined) {
            studentScores["t2"] = examScores[studentKey];
          } else {
            studentScores["t2"] = 0; // Default if not found (e.g. absent/inactive)
          }
        }

        return {
          studentId,
          scores: studentScores
        };
      });

      // Save Planilla directly as 'aprobado'
      await addDoc(collection(db, "planillas"), {
        subjectId: assignment.id,
        subjectName: subjectName,
        courseId: courseId,
        courseName: "Bachillerato Técnico en Informática",
        teacherId: teacher.id,
        teacherName: teacher.name,
        coordinatorId: coordId,
        grade: "3° Año",
        month: month,
        year: 2026,
        etapa: 1,
        tasks: tasks,
        scores: scores,
        status: "aprobado",
        submittedDate: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  console.log("DB Reseed completed successfully with official grades!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Reseed failed:", err);
  process.exit(1);
});
