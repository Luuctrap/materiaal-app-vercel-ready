
import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { utils, writeFile } from "xlsx";

export default function App() {
  const [klussen, setKlussen] = useState([]);
  const [huidigeKlus, setHuidigeKlus] = useState("");
  const [materiaal, setMateriaal] = useState("");
  const [aantal, setAantal] = useState(1);
  const [filterKlus, setFilterKlus] = useState("");
  const [filterMaand, setFilterMaand] = useState("");
  const [scannen, setScannen] = useState(false);
  const scannerRef = useRef(null);

  const voegKlusToe = () => {
    if (!huidigeKlus) return;
    setKlussen([...klussen, { naam: huidigeKlus, materialen: [] }]);
    setHuidigeKlus("");
  };

  const voegMateriaalToe = (klusIndex) => {
    const nieuweKlussen = [...klussen];
    nieuweKlussen[klusIndex].materialen.push({ naam: materiaal, aantal, datum: new Date() });
    setKlussen(nieuweKlussen);
    setMateriaal("");
    setAantal(1);
  };

  const startScanner = () => {
    setScannen(true);
    setTimeout(() => {
      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
        scanner.render((data) => {
          setMateriaal(data);
          setScannen(false);
          scanner.clear();
        });
        scannerRef.current = scanner;
      }
    }, 100);
  };

  const exporteerNaarExcel = () => {
    const data = klussen.flatMap((klus) => {
      if (filterKlus && klus.naam !== filterKlus) return [];
      return klus.materialen.filter((mat) => {
        if (!filterMaand) return true;
        const matDatum = new Date(mat.datum);
        const maand = `${matDatum.getFullYear()}-${String(matDatum.getMonth() + 1).padStart(2, '0')}`;
        return maand === filterMaand;
      }).map((mat) => ({
        Klus: klus.naam,

