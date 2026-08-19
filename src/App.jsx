import { useState, useEffect } from "react";
import {
  Percent, Target, LayoutGrid, Settings, HandCoins, Sprout, Heart, Baby,
  Users, Plus, Trash2, X, Lock, Car, AlertCircle, Banknote, ArrowUpRight
} from "lucide-react";
import { ensureAuth, getUserData, setUserData } from "./firebase";

/* ---------- PALETTE (pastel, elegant, light) ---------- */
const PALETTE = {
  bg: "#F6F1EA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1E9DC",
  border: "#E5D9C6",
  text: "#3E362E",
  muted: "#9A8D7C",
  gold: "#B8925A",
  pago: "#C9A15A",
  inversion: "#8FAE86",
  dios: "#D19B92",
  ahorro: "#9AA8C7",
  fondo: "#C98FA8",
  income: "#6B9860",
  expense: "#C1554B",
};

const DEFAULT_PIDAF = { p: 35, i: 29, d: 1, a: 35 };
const PIDAF_ROWS = [
  { key: "p", label: "Pago", icon: HandCoins, color: PALETTE.pago },
  { key: "i", label: "Inversión", icon: Sprout, color: PALETTE.inversion },
  { key: "d", label: "Dios", icon: Heart, color: PALETTE.dios },
  { key: "a", label: "Ahorro", icon: Baby, color: PALETTE.ahorro },
];

const fmt = (n) =>
  "S/ " + Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDateLong = (d) =>
  d.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }).replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDateShort = (dateStr) =>
  new Date(dateStr + "T00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const parseLocalDate = (dateStr) => new Date(dateStr + "T00:00");
const mondayOf = (dateStr) => {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
};
const isoDay = (d, offset) => {
  const c = new Date(d);
  c.setDate(c.getDate() + offset);
  return c.toISOString().slice(0, 10);
};
const fmtDayDate = (dateStr) =>
  parseLocalDate(dateStr).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });

const emptyData = {
  goals: [],
  autoFund20: 0,
  pidaf: { percentages: DEFAULT_PIDAF, distributions: [] },
  cuentaCarro: { entries: [] },
  retiros: { fondo20: [], prestamos: [] },
};

export default function FinanzasApp() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [tab, setTab] = useState("pidaf");
  const [showAddGoal, setShowAddGoal] = useState(null); // null | "new" | goal obj
  const [editPidafPct, setEditPidafPct] = useState(false);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await ensureAuth();
        setUid(user.uid);
        const parsed = await getUserData(user.uid);
        if (parsed) {
          setData({
            ...emptyData,
            ...parsed,
            pidaf: { ...emptyData.pidaf, ...(parsed.pidaf || {}) },
            cuentaCarro: { ...emptyData.cuentaCarro, ...(parsed.cuentaCarro || {}) },
            retiros: { ...emptyData.retiros, ...(parsed.retiros || {}) },
          });
        }
      } catch (e) {
        // sin datos guardados aún, o sin conexión la primera vez
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    if (!uid) { setSaveState("error"); return; }
    setSaveState("saving");
    try {
      await setUserData(uid, next);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (e) {
      setSaveState("error");
    }
  };

  const savePidafPercentages = (pct) => {
    persist({ ...data, pidaf: { ...data.pidaf, percentages: pct } });
    setEditPidafPct(false);
  };

  const saveDistribution = (dist) => {
    persist({
      ...data,
      autoFund20: (data.autoFund20 || 0) + dist.split20,
      pidaf: { ...data.pidaf, distributions: [{ ...dist, id: Date.now().toString() }, ...data.pidaf.distributions] },
    });
  };

  const deleteDistribution = (id) => {
    const dist = data.pidaf.distributions.find((d) => d.id === id);
    persist({
      ...data,
      autoFund20: Math.max(0, (data.autoFund20 || 0) - (dist ? dist.split20 : 0)),
      pidaf: { ...data.pidaf, distributions: data.pidaf.distributions.filter((d) => d.id !== id) },
    });
  };

  const addGoal = (goal) => {
    persist({ ...data, goals: [...data.goals, { ...goal, id: Date.now().toString(), saved: 0 }] });
  };

  const deposit = (goalId, amount) => {
    persist({
      ...data,
      goals: data.goals.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g)),
    });
    setShowAddGoal(null);
  };

  const deleteGoal = (id) => {
    persist({ ...data, goals: data.goals.filter((g) => g.id !== id) });
  };

  const addCarroEntry = (entry) => {
    persist({
      ...data,
      cuentaCarro: { ...data.cuentaCarro, entries: [{ ...entry, id: Date.now().toString() }, ...data.cuentaCarro.entries] },
    });
  };

  const deleteCarroEntry = (id) => {
    persist({ ...data, cuentaCarro: { ...data.cuentaCarro, entries: data.cuentaCarro.entries.filter((e) => e.id !== id) } });
  };

  const withdrawFondo20 = (retiro) => {
    persist({
      ...data,
      retiros: { ...data.retiros, fondo20: [{ ...retiro, id: Date.now().toString() }, ...data.retiros.fondo20] },
    });
  };

  const deleteRetiroFondo20 = (id) => {
    persist({ ...data, retiros: { ...data.retiros, fondo20: data.retiros.fondo20.filter((r) => r.id !== id) } });
  };

  const addPrestamo = (prestamo) => {
    persist({
      ...data,
      retiros: { ...data.retiros, prestamos: [{ ...prestamo, id: Date.now().toString() }, ...data.retiros.prestamos] },
    });
  };

  const deletePrestamo = (id) => {
    persist({ ...data, retiros: { ...data.retiros, prestamos: data.retiros.prestamos.filter((p) => p.id !== id) } });
  };

  if (!loaded) {
    return (
      <div style={styles.root}>
        <GlobalFonts />
        <div style={styles.center}>Cargando tus finanzas…</div>
      </div>
    );
  }

  const inversionTotal = data.pidaf.distributions.reduce((s, d) => s + (d.amounts?.i || 0), 0);
  const inversionRetirado = data.retiros.prestamos.filter((p) => p.origen === "inversion").reduce((s, p) => s + p.amount, 0);
  const inversionDisponible = inversionTotal - inversionRetirado;

  const carroTotal = data.cuentaCarro.entries.reduce((s, e) => s + e.amount, 0);
  const carroRetirado = data.retiros.prestamos.filter((p) => p.origen === "carro").reduce((s, p) => s + p.amount, 0);
  const carroDisponible = carroTotal - carroRetirado;

  const fondo20Retirado = data.retiros.fondo20.reduce((s, r) => s + r.amount, 0);
  const fondo20Disponible = (data.autoFund20 || 0) - fondo20Retirado;

  return (
    <div style={styles.root}>
      <GlobalFonts />
      <header style={styles.header}>
        <span style={styles.dateLabel}>{fmtDateLong(new Date())}</span>
        <SaveIndicator state={saveState} />
      </header>

      <main style={styles.main}>
        {tab === "pidaf" && (
          <PidafTab
            percentages={data.pidaf.percentages}
            distributions={data.pidaf.distributions}
            onEditPct={() => setEditPidafPct(true)}
            onSave={saveDistribution}
            onDelete={deleteDistribution}
          />
        )}
        {tab === "metas" && (
          <Metas
            goals={data.goals}
            autoFund20={fondo20Disponible}
            onDeposit={setShowAddGoal}
            onDelete={deleteGoal}
            onAdd={() => setShowAddGoal("new")}
          />
        )}
        {tab === "carro" && (
          <CuentaCarroTab entries={data.cuentaCarro.entries} onAdd={addCarroEntry} onDelete={deleteCarroEntry} />
        )}
        {tab === "retiros" && (
          <RetirosTab
            fondo20Disponible={fondo20Disponible}
            fondo20Historial={data.retiros.fondo20}
            onWithdrawFondo20={withdrawFondo20}
            onDeleteFondo20={deleteRetiroFondo20}
            inversionDisponible={inversionDisponible}
            carroDisponible={carroDisponible}
            prestamos={data.retiros.prestamos}
            onAddPrestamo={addPrestamo}
            onDeletePrestamo={deletePrestamo}
          />
        )}
        {tab === "resumen" && <Resumen distributions={data.pidaf.distributions} goals={data.goals} autoFund20={fondo20Disponible} />}
      </main>

      <nav style={styles.nav}>
        <NavBtn active={tab === "pidaf"} onClick={() => setTab("pidaf")} icon={Percent} label="PIDAF" />
        <NavBtn active={tab === "metas"} onClick={() => setTab("metas")} icon={Target} label="Metas" />
        <NavBtn active={tab === "carro"} onClick={() => setTab("carro")} icon={Car} label="Carro" />
        <NavBtn active={tab === "retiros"} onClick={() => setTab("retiros")} icon={Banknote} label="Retiros" />
        <NavBtn active={tab === "resumen"} onClick={() => setTab("resumen")} icon={LayoutGrid} label="Resumen" />
      </nav>

      {editPidafPct && (
        <EditPidafPctModal current={data.pidaf.percentages} onClose={() => setEditPidafPct(false)} onSave={savePidafPercentages} />
      )}
      {showAddGoal === "new" && <AddGoalModal onClose={() => setShowAddGoal(null)} onSave={addGoal} />}
      {showAddGoal && showAddGoal !== "new" && (
        <DepositModal goal={showAddGoal} onClose={() => setShowAddGoal(null)} onSave={deposit} />
      )}
    </div>
  );
}

function GlobalFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; }
      input:focus, button:focus, select:focus { outline: 2px solid ${PALETTE.gold}; outline-offset: 1px; }
      .hscroll::-webkit-scrollbar { display: none; }
    `}</style>
  );
}

const styles = {
  root: {
    fontFamily: "'Inter', sans-serif",
    background: PALETTE.bg,
    color: PALETTE.text,
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  center: {
    display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
    color: PALETTE.muted, fontFamily: "'Inter', sans-serif",
  },
  header: {
    padding: "18px 20px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: { fontSize: 13, fontWeight: 600, color: PALETTE.text, letterSpacing: 0.2 },
  main: { flex: 1, padding: "4px 20px 24px", overflowY: "auto" },
  nav: {
    display: "flex",
    borderTop: `1px solid ${PALETTE.border}`,
    background: PALETTE.surface,
    padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
    position: "sticky",
    bottom: 0,
  },
};

function SaveIndicator({ state }) {
  const label = { idle: "", saving: "Guardando…", saved: "Guardado", error: "Sin conexión" }[state];
  if (!label) return <div style={{ width: 60 }} />;
  return (
    <span style={{ fontSize: 11, color: state === "error" ? PALETTE.expense : PALETTE.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
      {label}
    </span>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: "none", border: "none", display: "flex",
        flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0",
        cursor: "pointer", color: active ? PALETTE.gold : PALETTE.muted,
      }}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 500 }}>{label}</span>
    </button>
  );
}

const ss = {
  card: {
    background: PALETTE.surface,
    border: `1px solid ${PALETTE.border}`,
    borderRadius: 16,
    padding: 20,
    marginTop: 6,
    boxShadow: "0 2px 10px rgba(62,54,46,0.05)",
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: PALETTE.muted, margin: "22px 0 10px",
    textTransform: "uppercase", letterSpacing: 0.6,
  },
};

/* ================= PIDAF ================= */
function PidafTab({ percentages, distributions, onEditPct, onSave, onDelete }) {
  const [total, setTotal] = useState("");
  const n = parseFloat(total) || 0;
  const split80 = n * 0.8;
  const split20 = n * 0.2;
  const rows = PIDAF_ROWS.map((r) => ({ ...r, amount: split80 * (percentages[r.key] / 100) }));
  const fondoAmount = (rows.find((r) => r.key === "p")?.amount || 0) * 0.2;
  const pctSum = PIDAF_ROWS.reduce((s, r) => s + (percentages[r.key] || 0), 0);

  const handleSave = () => {
    if (n <= 0) return;
    onSave({
      date: new Date().toISOString().slice(0, 10),
      total: n,
      split80,
      split20,
      percentages,
      amounts: Object.fromEntries(rows.map((r) => [r.key, r.amount])),
      fondo: fondoAmount,
    });
    setTotal("");
  };

  return (
    <div>
      <div style={ss.sectionTitle}>Nueva distribución</div>
      <div style={ss.card}>
        <label style={labelStyle}>Monto total a distribuir (S/)</label>
        <input
          style={{ ...inputStyle, marginBottom: 4, fontSize: 22, fontFamily: "'Fraunces', serif" }}
          type="number" inputMode="decimal" value={total}
          onChange={(e) => setTotal(e.target.value)} placeholder="0.00"
        />

        {n > 0 && (
          <>
            <div style={ss.sectionTitle}>80 – 20</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={pidafBox}>
                <div style={pidafBoxLabel}>80%</div>
                <div style={pidafBoxAmt}>{fmt(split80)}</div>
              </div>
              <div style={pidafBox}>
                <div style={pidafBoxLabel}>20%</div>
                <div style={pidafBoxAmt}>{fmt(split20)}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0 10px" }}>
              <span style={{ ...ss.sectionTitle, margin: 0 }}>
                Método PIDAF {pctSum !== 100 && <span style={{ color: PALETTE.expense }}>· suma {pctSum}%</span>}
              </span>
              <button onClick={onEditPct} style={pctEditBtn}>
                <Settings size={13} /> Editar %
              </button>
            </div>
            {rows.map((r) => (
              <PidafRowLine key={r.key} label={r.label} icon={r.icon} color={r.color} pct={percentages[r.key]} amount={r.amount} />
            ))}
            <PidafRowLine
              label="Fondo pareja"
              icon={Users}
              color={PALETTE.fondo}
              pct="20% de Pago"
              amount={fondoAmount}
              noBorder
            />

            <button style={primaryBtn} onClick={handleSave}>Guardar distribución</button>
          </>
        )}
      </div>

      {distributions.length > 0 && (
        <>
          <div style={ss.sectionTitle}>Historial · desliza →</div>
          <div className="hscroll" style={historyScroll}>
            {distributions.map((d) => (
              <DistributionCard key={d.id} d={d} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PidafRowLine({ label, icon: Icon, color, pct, amount, noBorder }) {
  return (
    <div style={{ ...pidafRow, borderBottom: noBorder ? "none" : `1px solid ${PALETTE.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color + "26", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 11, color: PALETTE.muted }}>{typeof pct === "number" ? `${pct}%` : pct}</div>
        </div>
      </div>
      <span style={{ fontFamily: "IBM Plex Mono", fontSize: 14, fontWeight: 500 }}>{fmt(amount)}</span>
    </div>
  );
}

const historyScroll = {
  display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
  paddingBottom: 6, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
};

function DistributionCard({ d, onDelete }) {
  return (
    <div style={{
      background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 16,
      padding: 16, minWidth: "82%", flexShrink: 0, scrollSnapAlign: "start",
      boxShadow: "0 2px 10px rgba(62,54,46,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>
            {new Date(d.date + "T00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
          <div style={{ fontSize: 12, color: PALETTE.muted, fontFamily: "IBM Plex Mono", marginTop: 2 }}>{fmt(d.total)}</div>
        </div>
        <button onClick={() => onDelete(d.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Trash2 size={15} color={PALETTE.muted} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={pidafBoxSm}><div style={pidafBoxLabel}>80%</div><div style={{ ...pidafBoxAmt, fontSize: 14 }}>{fmt(d.split80)}</div></div>
        <div style={pidafBoxSm}><div style={pidafBoxLabel}>20%</div><div style={{ ...pidafBoxAmt, fontSize: 14 }}>{fmt(d.split20)}</div></div>
      </div>
      {PIDAF_ROWS.map((r) => (
        <div key={r.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
          <span style={{ color: PALETTE.muted }}>{r.label} ({d.percentages[r.key]}%)</span>
          <span style={{ fontFamily: "IBM Plex Mono" }}>{fmt(d.amounts[r.key])}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
        <span style={{ color: PALETTE.muted }}>Fondo pareja (20% de Pago)</span>
        <span style={{ fontFamily: "IBM Plex Mono" }}>{fmt(d.fondo || 0)}</span>
      </div>
    </div>
  );
}

const pidafBox = { flex: 1, background: PALETTE.surfaceAlt, borderRadius: 10, padding: "10px 12px" };
const pidafBoxSm = { flex: 1, background: PALETTE.surfaceAlt, borderRadius: 8, padding: "7px 10px" };
const pidafBoxLabel = { fontSize: 11, color: PALETTE.muted };
const pidafBoxAmt = { fontFamily: "IBM Plex Mono", fontSize: 16, fontWeight: 600, marginTop: 2, color: PALETTE.text };
const pidafRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" };
const pctEditBtn = {
  display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${PALETTE.border}`,
  color: PALETTE.muted, borderRadius: 8, padding: "4px 9px", fontSize: 11, cursor: "pointer",
};

function EditPidafPctModal({ current, onClose, onSave }) {
  const [vals, setVals] = useState({ ...current });
  const sum = PIDAF_ROWS.reduce((s, r) => s + (parseFloat(vals[r.key]) || 0), 0);

  return (
    <ModalShell title="Editar porcentajes PIDAF" onClose={onClose}>
      {PIDAF_ROWS.map((r) => (
        <div key={r.key} style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{r.label} (%)</label>
          <input
            style={{ ...inputStyle, marginBottom: 0 }}
            type="number" inputMode="decimal" value={vals[r.key]}
            onChange={(e) => setVals({ ...vals, [r.key]: e.target.value })}
          />
        </div>
      ))}
      <div style={{ fontSize: 12, color: sum === 100 ? PALETTE.income : PALETTE.expense, marginBottom: 12, textAlign: "center" }}>
        Suma actual: {sum}% {sum === 100 ? "✓" : "· debe sumar 100%"}
      </div>
      <button
        style={{ ...primaryBtn, opacity: sum === 100 ? 1 : 0.5 }}
        disabled={sum !== 100}
        onClick={() => onSave(Object.fromEntries(PIDAF_ROWS.map((r) => [r.key, parseFloat(vals[r.key]) || 0])))}
      >
        Guardar porcentajes
      </button>
    </ModalShell>
  );
}

/* ================= METAS ================= */
function Metas({ goals, autoFund20, onDeposit, onDelete, onAdd }) {
  return (
    <div>
      <div style={ss.sectionTitle}>Fondo automático</div>
      <div style={{
        ...ss.card, marginTop: 0,
        background: `linear-gradient(135deg, ${PALETTE.surface} 0%, #F3E8EE 100%)`,
        border: `1px solid ${PALETTE.fondo}55`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: PALETTE.fondo + "26",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Lock size={18} color={PALETTE.fondo} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>20% acumulado</div>
            <div style={{ fontSize: 11, color: PALETTE.muted }}>Se suma solo con cada PIDAF · intocable</div>
          </div>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, marginTop: 12 }}>
          {fmt(autoFund20)}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0 10px" }}>
        <span style={{ ...ss.sectionTitle, margin: 0 }}>Metas de ahorro</span>
        <button onClick={onAdd} style={{
          background: "none", border: `1px solid ${PALETTE.gold}`, color: PALETTE.gold,
          borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600,
        }}>
          + Nueva meta
        </button>
      </div>
      {goals.length === 0 ? (
        <EmptyState text="Crea tu primera meta de ahorro." />
      ) : (
        goals.map((g) => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
          return (
            <div key={g.id} style={{ ...ss.card, marginTop: 0, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2, fontFamily: "IBM Plex Mono" }}>
                    {fmt(g.saved)} de {fmt(g.target)}
                  </div>
                </div>
                <button onClick={() => onDelete(g.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={15} color={PALETTE.muted} />
                </button>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: PALETTE.surfaceAlt, overflow: "hidden", marginTop: 12 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: PALETTE.gold, borderRadius: 4 }} />
              </div>
              <button onClick={() => onDeposit(g)} style={{
                marginTop: 12, width: "100%", background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}`,
                color: PALETTE.text, borderRadius: 8, padding: "8px 0", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                Agregar dinero
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

function AddGoalModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const submit = () => {
    const t = parseFloat(target);
    if (!name.trim() || !t || t <= 0) return;
    onSave({ name: name.trim(), target: t });
    onClose();
  };
  return (
    <ModalShell title="Nueva meta de ahorro" onClose={onClose}>
      <label style={labelStyle}>Nombre</label>
      <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Vacaciones, Fondo de emergencia" autoFocus />
      <label style={labelStyle}>Meta (S/)</label>
      <input style={inputStyle} type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" />
      <button style={primaryBtn} onClick={submit}>Crear meta</button>
    </ModalShell>
  );
}

function DepositModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  return (
    <ModalShell title={`Agregar a: ${goal.name}`} onClose={onClose}>
      <label style={labelStyle}>Monto (S/)</label>
      <input style={inputStyle} type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus />
      <button style={primaryBtn} onClick={() => { const n = parseFloat(amount); if (n > 0) onSave(goal.id, n); }}>
        Agregar
      </button>
    </ModalShell>
  );
}

/* ================= RESUMEN ================= */
function Resumen({ distributions, goals, autoFund20 }) {
  const totalDistribuido = distributions.reduce((s, d) => s + d.total, 0);
  const totalAhorrado = goals.reduce((s, g) => s + g.saved, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <div style={{ ...ss.card, marginTop: 0, flex: 1, padding: 14 }}>
          <div style={{ fontSize: 11, color: PALETTE.muted }}>Total distribuido</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, marginTop: 4 }}>{fmt(totalDistribuido)}</div>
        </div>
        <div style={{ ...ss.card, marginTop: 0, flex: 1, padding: 14 }}>
          <div style={{ fontSize: 11, color: PALETTE.muted }}>20% acumulado</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, marginTop: 4 }}>{fmt(autoFund20)}</div>
        </div>
      </div>

      <div style={ss.sectionTitle}>Resumen PIDAF</div>
      {distributions.length === 0 ? (
        <EmptyState text="Aún no registras distribuciones PIDAF." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {distributions.map((d) => (
            <div key={d.id} style={{
              background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 12,
              padding: 12, boxShadow: "0 2px 8px rgba(62,54,46,0.05)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{fmtDateShort(d.date)}</div>
              <div style={{ fontSize: 11, color: PALETTE.muted, fontFamily: "IBM Plex Mono", marginBottom: 8 }}>{fmt(d.total)}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div style={{ ...pidafBoxSm, padding: "5px 8px" }}>
                  <div style={{ fontSize: 9.5, color: PALETTE.muted }}>80%</div>
                  <div style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{fmt(d.split80)}</div>
                </div>
                <div style={{ ...pidafBoxSm, padding: "5px 8px" }}>
                  <div style={{ fontSize: 9.5, color: PALETTE.muted }}>20%</div>
                  <div style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{fmt(d.split20)}</div>
                </div>
              </div>
              {PIDAF_ROWS.map((r) => (
                <div key={r.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, padding: "1.5px 0" }}>
                  <span style={{ color: PALETTE.muted }}>{r.label[0]}</span>
                  <span style={{ fontFamily: "IBM Plex Mono" }}>{fmt(d.amounts[r.key])}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, padding: "1.5px 0" }}>
                <span style={{ color: PALETTE.muted }}>F</span>
                <span style={{ fontFamily: "IBM Plex Mono" }}>{fmt(d.fondo || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= CUENTA CARRO ================= */
function CuentaCarroTab({ entries, onAdd, onDelete }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");

  const submit = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    onAdd({ date, amount: n });
    setAmount("");
  };

  // Agrupar entradas por semana (lunes a sábado)
  const weeksMap = {};
  entries.forEach((e) => {
    const monday = mondayOf(e.date);
    const key = monday.toISOString().slice(0, 10);
    if (!weeksMap[key]) weeksMap[key] = { monday, days: {}, ids: {} };
    weeksMap[key].days[e.date] = (weeksMap[key].days[e.date] || 0) + e.amount;
    weeksMap[key].ids[e.date] = e.id;
  });
  const weeks = Object.values(weeksMap).sort((a, b) => (a.monday < b.monday ? 1 : -1));

  return (
    <div>
      <div style={ss.sectionTitle}>Registrar día</div>
      <div style={ss.card}>
        <label style={labelStyle}>Fecha</label>
        <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label style={labelStyle}>Monto ganado (S/)</label>
        <input
          style={{ ...inputStyle, marginBottom: 4, fontSize: 22, fontFamily: "'Fraunces', serif" }}
          type="number" inputMode="decimal" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
        />
        <button style={{ ...primaryBtn, marginTop: 14 }} onClick={submit}>Guardar día</button>
      </div>

      {weeks.length > 0 && (
        <>
          <div style={ss.sectionTitle}>Semanas · desliza →</div>
          <div className="hscroll" style={historyScroll}>
            {weeks.map((w) => {
              const monday = w.monday;
              const total = Object.values(w.days).reduce((s, v) => s + v, 0);
              return (
                <div key={monday.toISOString()} style={weekCard}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces', serif", marginBottom: 12 }}>
                    Semana del {fmtDayDate(isoDay(monday, 0))} al {fmtDayDate(isoDay(monday, 5))}
                  </div>
                  {DAY_LABELS.map((label, i) => {
                    const dStr = isoDay(monday, i);
                    const amt = w.days[dStr];
                    return (
                      <div key={dStr} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${PALETTE.border}` }}>
                        <span style={{ fontSize: 12.5, color: PALETTE.muted }}>{label} ({fmtDayDate(dStr)})</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 13, fontWeight: amt ? 600 : 400, color: amt ? PALETTE.text : PALETTE.muted }}>
                            {amt ? fmt(amt) : "—"}
                          </span>
                          {amt > 0 && (
                            <button onClick={() => onDelete(w.ids[dStr])} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                              <Trash2 size={13} color={PALETTE.muted} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Total semana</span>
                    <span style={{ fontFamily: "IBM Plex Mono", fontSize: 15, fontWeight: 700, color: PALETTE.gold }}>{fmt(total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const weekCard = {
  background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 16,
  padding: 16, minWidth: "84%", flexShrink: 0, scrollSnapAlign: "start",
  boxShadow: "0 2px 10px rgba(62,54,46,0.05)",
};

/* ================= RETIROS ================= */
function RetirosTab({
  fondo20Disponible, fondo20Historial, onWithdrawFondo20, onDeleteFondo20,
  inversionDisponible, carroDisponible, prestamos, onAddPrestamo, onDeletePrestamo,
}) {
  const [emgAmount, setEmgAmount] = useState("");
  const [emgMotivo, setEmgMotivo] = useState("");
  const [prAmount, setPrAmount] = useState("");
  const [prQuien, setPrQuien] = useState("");
  const [prOrigen, setPrOrigen] = useState("inversion");

  const submitEmergencia = () => {
    const n = parseFloat(emgAmount);
    if (!n || n <= 0 || n > fondo20Disponible) return;
    onWithdrawFondo20({ date: new Date().toISOString().slice(0, 10), amount: n, motivo: emgMotivo || "Emergencia" });
    setEmgAmount(""); setEmgMotivo("");
  };

  const submitPrestamo = () => {
    const n = parseFloat(prAmount);
    const disponible = prOrigen === "inversion" ? inversionDisponible : carroDisponible;
    if (!n || n <= 0 || n > disponible || !prQuien.trim()) return;
    onAddPrestamo({ date: new Date().toISOString().slice(0, 10), amount: n, quien: prQuien.trim(), origen: prOrigen });
    setPrAmount(""); setPrQuien("");
  };

  return (
    <div>
      {/* Emergencias — Fondo 20% */}
      <div style={ss.sectionTitle}>Emergencias · Fondo 20%</div>
      <div style={{ ...ss.card, background: `linear-gradient(135deg, ${PALETTE.surface} 0%, #F3E8EE 100%)`, border: `1px solid ${PALETTE.fondo}55` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: PALETTE.fondo + "26", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={17} color={PALETTE.fondo} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: PALETTE.muted }}>Disponible</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600 }}>{fmt(fondo20Disponible)}</div>
          </div>
        </div>
        <label style={labelStyle}>Monto a retirar (S/)</label>
        <input style={inputStyle} type="number" inputMode="decimal" value={emgAmount} onChange={(e) => setEmgAmount(e.target.value)} placeholder="0.00" />
        <label style={labelStyle}>Motivo</label>
        <input style={inputStyle} value={emgMotivo} onChange={(e) => setEmgMotivo(e.target.value)} placeholder="Ej. Hijo enfermo" />
        <button
          style={{ ...primaryBtn, background: PALETTE.fondo, opacity: emgAmount && parseFloat(emgAmount) <= fondo20Disponible ? 1 : 0.5 }}
          onClick={submitEmergencia}
        >
          Registrar retiro
        </button>
      </div>
      {fondo20Historial.length > 0 && fondo20Historial.map((r) => (
        <RetiroRow key={r.id} title={r.motivo} sub={fmtDateShort(r.date)} amount={r.amount} color={PALETTE.fondo} onDelete={() => onDeleteFondo20(r.id)} />
      ))}

      {/* Préstamos */}
      <div style={ss.sectionTitle}>Préstamos</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ ...pidafBox, background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}>
          <div style={pidafBoxLabel}>Inversión</div>
          <div style={{ ...pidafBoxAmt, fontSize: 15 }}>{fmt(inversionDisponible)}</div>
        </div>
        <div style={{ ...pidafBox, background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}>
          <div style={pidafBoxLabel}>Cuenta Carro</div>
          <div style={{ ...pidafBoxAmt, fontSize: 15 }}>{fmt(carroDisponible)}</div>
        </div>
      </div>
      <div style={ss.card}>
        <label style={labelStyle}>Origen del préstamo</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[{ id: "inversion", label: "Inversión" }, { id: "carro", label: "Cuenta Carro" }].map((o) => (
            <button key={o.id} onClick={() => setPrOrigen(o.id)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
              border: `1px solid ${o.id === prOrigen ? PALETTE.gold : PALETTE.border}`,
              background: o.id === prOrigen ? PALETTE.gold + "1A" : "transparent",
              color: o.id === prOrigen ? PALETTE.gold : PALETTE.muted, fontWeight: 600, fontSize: 12.5,
            }}>
              {o.label}
            </button>
          ))}
        </div>
        <label style={labelStyle}>A quién</label>
        <input style={inputStyle} value={prQuien} onChange={(e) => setPrQuien(e.target.value)} placeholder="Nombre" />
        <label style={labelStyle}>Monto (S/)</label>
        <input style={inputStyle} type="number" inputMode="decimal" value={prAmount} onChange={(e) => setPrAmount(e.target.value)} placeholder="0.00" />
        <button style={primaryBtn} onClick={submitPrestamo}>Registrar préstamo</button>
      </div>
      {prestamos.length > 0 && prestamos.map((p) => (
        <RetiroRow
          key={p.id}
          title={p.quien}
          sub={`${p.origen === "inversion" ? "Inversión" : "Cuenta Carro"} · ${fmtDateShort(p.date)}`}
          amount={p.amount}
          color={PALETTE.gold}
          onDelete={() => onDeletePrestamo(p.id)}
        />
      ))}
    </div>
  );
}

function RetiroRow({ title, sub, amount, color, onDelete }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, background: PALETTE.surface,
      border: `1px solid ${PALETTE.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "26", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ArrowUpRight size={16} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 11, color: PALETTE.muted }}>{sub}</div>
      </div>
      <span style={{ fontFamily: "IBM Plex Mono", fontSize: 13, fontWeight: 600, color: PALETTE.expense }}>−{fmt(amount)}</span>
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer" }}>
        <Trash2 size={14} color={PALETTE.muted} />
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      textAlign: "center", padding: "32px 16px", color: PALETTE.muted, fontSize: 13,
      border: `1px dashed ${PALETTE.border}`, borderRadius: 12, background: PALETTE.surface,
    }}>
      {text}
    </div>
  );
}

/* ================= SHARED / MODALS ================= */
function ModalShell({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(62,54,46,0.35)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PALETTE.surface, borderRadius: "18px 18px 0 0", padding: 20,
          width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
          borderTop: `1px solid ${PALETTE.border}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} color={PALETTE.muted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}`,
  borderRadius: 10, padding: "12px 14px", color: PALETTE.text, fontSize: 15,
  fontFamily: "Inter, sans-serif", marginBottom: 12,
};
const labelStyle = { fontSize: 12, color: PALETTE.muted, marginBottom: 6, display: "block" };
const primaryBtn = {
  width: "100%", background: PALETTE.gold, border: "none", borderRadius: 10,
  padding: "13px 0", color: "#FFFFFF", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4,
};
