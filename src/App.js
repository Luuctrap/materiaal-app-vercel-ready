import { useState, useRef } from "react";
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
        Materiaal: mat.naam,
        Aantal: mat.aantal,
        Datum: new Date(mat.datum).toLocaleDateString()
      }));
    });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Materialen");
    writeFile(wb, "materiaalregistratie.xlsx");
  };

  const uniekeKlussen = Array.from(new Set(klussen.map(k => k.naam)));
  const uniekeMaanden = Array.from(new Set(
    klussen.flatMap(k => k.materialen.map(m => {
      const d = new Date(m.datum);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))
  ));

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Materiaalregistratie per Klus</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="Nieuwe klusnaam" value={huidigeKlus} onChange={(e) => setHuidigeKlus(e.target.value)} />
        <button onClick={voegKlusToe}>Klus toevoegen</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <select value={filterKlus} onChange={(e) => setFilterKlus(e.target.value)}>
          <option value="">Alle klussen</option>
          {uniekeKlussen.map((k, i) => <option key={i} value={k}>{k}</option>)}
        </select>
        <select value={filterMaand} onChange={(e) => setFilterMaand(e.target.value)}>
          <option value="">Alle maanden</option>
          {uniekeMaanden.map((m, i) => <option key={i} value={m}>{m}</option>)}
        </select>
        <button onClick={exporteerNaarExcel}>Exporteren</button>
      </div>

      {klussen.map((klus, index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <h2>Klus: {klus.naam}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input placeholder="Materiaal" value={materiaal} onChange={(e) => setMateriaal(e.target.value)} />
            <input type="number" min={1} value={aantal} onChange={(e) => setAantal(Number(e.target.value))} />
            <button onClick={() => voegMateriaalToe(index)}>Toevoegen</button>
            <button onClick={startScanner}>QR Scan</button>
          </div>
          <ul>
            {klus.materialen.map((mat, i) => (
              <li key={i}>{mat.naam} – {mat.aantal} stuks</li>
            ))}
          </ul>
          {scannen && <div id="qr-reader" style={{ width: '100%' }} />}
        </div>
      ))}
    </div>
  );
}

