import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Heart, 
  MapPin, 
  Activity, 
  Globe, 
  Send, 
  TrendingUp, 
  Award,
  BookOpen,
  MountainSnow,
  Share2,
  CheckCircle2,
  X,
  Instagram,
  Camera,
  ArrowLeft
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyB1X-AS1r_ZhqPubGFEPEAJ1cIX59H9kNU",
  authDomain: "cruzada-app-4d26a.firebaseapp.com",
  projectId: "cruzada-app-4d26a",
  storageBucket: "cruzada-app-4d26a.firebasestorage.app",
  messagingSenderId: "466449896774",
  appId: "1:466449896774:web:485927fa6235ad6357c147",
  measurementId: "G-3HV2HP8BCH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Lista de países
const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", 
  "Ecuador", "España", "Estados Unidos", "México", 
  "Paraguay", "Perú", "Uruguay", "Venezuela", "Otro"
];

export default function CapitalDeGraciasApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('input'); 
  
  // Estado del formulario
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('rosario'); 
  const [country, setCountry] = useState('Chile');
  const [submitting, setSubmitting] = useState(false);
  const [lastContribution, setLastContribution] = useState(null); 
  
  // Estado para el modo "Tarjeta de Historia"
  const [showStoryCard, setShowStoryCard] = useState(false);

  // Datos en tiempo real
  const [contributions, setContributions] = useState([]);

  // 1. Autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error auth:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Escuchar datos
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'contributions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setContributions(docs);
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [user]);

  // 3. Stats
  const stats = useMemo(() => {
    const countryStats = {};
    let totalRosaries = 0;
    let totalKm = 0;

    contributions.forEach(c => {
      const cName = c.country || 'Desconocido';
      const val = parseInt(c.amount) || 0;
      if (!countryStats[cName]) countryStats[cName] = { rosaries: 0, km: 0 };
      
      if (c.type === 'rosario') {
        countryStats[cName].rosaries += val;
        totalRosaries += val;
      } else {
        countryStats[cName].km += val;
        totalKm += val;
      }
    });

    const ranking = Object.entries(countryStats).map(([name, data]) => ({
      name, ...data
    })).sort((a, b) => b.rosaries - a.rosaries);

    return { totalRosaries, totalKm, ranking };
  }, [contributions]);

  // 4. Enviar
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contributions'), {
        amount: parseInt(amount), type, country,
        timestamp: serverTimestamp(), userId: user.uid
      });
      setLastContribution({ amount, type, country });
      setAmount('');
    } catch (error) {
      console.error(error);
      alert("Error al enviar. Verifica tu conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  // Función WhatsApp (Link Dinámico)
  const handleShareWhatsApp = () => {
    if (!lastContribution) return;
    const emoji = lastContribution.type === 'rosario' ? '📿' : '👣';
    // Usamos window.location.href para obtener el link actual real
    const currentUrl = window.location.href;
    const text = `¡He sumado ${lastContribution.amount} ${lastContribution.type === 'rosario' ? 'Rosarios' : 'Km'} al Capital de Gracias de la Cruzada de María! ${emoji}🏔️\n\nPeregrino en Alianza, ¡súmate tú también aquí! 👇\n${currentUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-sky-400 font-serif">Cargando...</div>;

  // --- VISTA ESPECIAL: TARJETA PARA HISTORIA INSTAGRAM ---
  if (showStoryCard && lastContribution) {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-6"
        onClick={() => setShowStoryCard(false)}
      >
        {/* Fondo borroso de la imagen para ambiente */}
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070" className="w-full h-full object-cover blur-md" />
        </div>

        <div className="relative z-10 w-full max-w-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center aspect-[9/16] justify-center space-y-8 animate-fade-in">
          
          <div className="absolute top-4 right-4">
             {/* Icono Original MountainSnow */}
             <MountainSnow className="text-white/30" size={48} strokeWidth={1.5} />
          </div>

          <div>
            <h2 className="text-2xl font-serif text-amber-200 tracking-widest uppercase mb-1">Cruzada de María</h2>
            <div className="h-0.5 w-16 bg-amber-500 mx-auto rounded-full"></div>
            {/* Lema Actualizado en la Historia */}
            <p className="text-white/70 text-sm mt-3 font-serif italic">"Peregrino en Alianza, Levanta el corazón"</p>
          </div>

          <div className="py-6">
            <div className="text-6xl font-bold font-serif text-white mb-2 drop-shadow-lg">
              +{lastContribution.amount}
            </div>
            <div className={`text-2xl font-medium uppercase tracking-wider ${lastContribution.type === 'rosario' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lastContribution.type === 'rosario' ? 'Rosarios' : 'Kilómetros'}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl px-6 py-3 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 text-sky-200">
              <Globe size={18} />
              <span className="font-semibold text-lg">{lastContribution.country}</span>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Capital de Gracias</p>
            <div className="flex gap-4 justify-center text-sm font-bold text-white/80">
              <span>📿 {stats.totalRosaries.toLocaleString()}</span>
              <span>👣 {stats.totalKm.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-amber-200 font-bold mb-2 animate-bounce">¡Haz una Captura de Pantalla! 📸</p>
          <p className="text-white/50 text-sm">Toca en cualquier lugar para volver</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-100 pb-24 selection:bg-amber-500/30 relative overflow-hidden">
      
      {/* --- FONDO FIJO DE MONTAÑAS NOCTURNAS --- */}
      <div className="fixed inset-0 z-0">
        <img 
          src="\Fondo-cruzada.jpg"
          alt="Fondo Cruz de Marío" 
          className="w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95" />
      </div>
      
      <div className="relative z-10">
        
        {/* HEADER */}
        <header className="text-white pt-8 pb-16 px-6 border-b border-white/5">
          <div className="text-center">
            <div className="flex flex-col items-center justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full"></div>
                {/* Icono Original MountainSnow */}
               <img 
                  src="/Icono.png" 
                  alt="Logo Cruzada" 
                  className="w-16 h-16 object-contain relative z-10 drop-shadow-lg" 
              />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white font-serif drop-shadow-md leading-tight mt-3">
                Cruzada de María
              </h1>
              <span className="text-amber-400/90 font-serif text-lg tracking-[0.2em] mt-1 font-light border-t border-amber-500/30 pt-1 px-4">
                2026
              </span>
            </div>
            {/* Lema Actualizado en el Header */}
            <p className="text-sky-100/60 text-sm font-medium italic font-serif mt-3 tracking-wide">
              "Peregrino en Alianza, Levanta el corazón"
            </p>
          </div>
        </header>

        {/* CONTADORES GLOBALES */}
        <div className="mx-4 -mt-10 mb-6">
          <div className="flex justify-between bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl ring-1 ring-white/5">
            <div className="text-center w-1/2 border-r border-white/10">
              <div className="text-3xl font-bold text-amber-400 font-serif drop-shadow-lg">{stats.totalRosaries.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60 text-slate-200 font-semibold mt-1">Rosarios</div>
            </div>
            <div className="text-center w-1/2">
              <div className="text-3xl font-bold text-emerald-400 font-serif drop-shadow-lg">{stats.totalKm.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60 text-slate-200 font-semibold mt-1">Kilómetros</div>
            </div>
          </div>
        </div>

        <main className="max-w-md mx-auto px-4">
          
          {/* VISTA: REGISTRO */}
          {view === 'input' && (
            <div className="animate-fade-in">
              {!lastContribution ? (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/10">
                  <h2 className="text-lg font-bold mb-6 text-white text-center font-serif tracking-wide border-b border-white/5 pb-4">
                    REGISTRAR APORTE
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setType('rosario')}
                        className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                          type === 'rosario' 
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                            : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <BookOpen size={24} className={`mb-2 ${type === 'rosario' ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className="font-serif text-sm">Rosarios</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setType('km')}
                        className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                          type === 'km' 
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                            : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <MapPin size={24} className={`mb-2 ${type === 'km' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="font-serif text-sm">Kilómetros</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full p-4 text-center text-3xl font-serif bg-black/20 border border-white/10 rounded-xl focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none text-white placeholder-white/10 transition-all shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">País</label>
                        <div className="relative">
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full p-4 bg-black/20 border border-white/10 rounded-xl appearance-none outline-none text-slate-200 font-medium focus:bg-slate-900"
                          >
                            {COUNTRIES.map(c => (
                              <option key={c} value={c} className="bg-slate-900">{c}</option>
                            ))}
                          </select>
                          <Globe size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !amount}
                      className="w-full bg-gradient-to-r from-sky-800 to-indigo-800 hover:from-sky-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 border border-white/10"
                    >
                      {submitting ? 'Enviando...' : <><Send size={18} /> Enviar Aporte</>}
                    </button>
                  </form>
                </div>
              ) : (
                // --- VISTA DE ÉXITO ---
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-emerald-500/30 text-center animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                  
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 ring-1 ring-emerald-500/30">
                    <CheckCircle2 size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-serif font-bold text-white mb-1">¡Aporte Recibido!</h3>
                  <p className="text-slate-400 mb-6 text-sm">
                    Has sumado <span className="text-white font-bold">{lastContribution.amount} {lastContribution.type === 'rosario' ? 'Rosarios' : 'Km'}</span>.<br/>
                  </p>

                  <div className="space-y-3">
                    {/* Botón WhatsApp */}
                    <button 
                      onClick={handleShareWhatsApp}
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                      <Share2 size={20} />
                      Compartir en WhatsApp
                    </button>
                    
                    {/* Botón Instagram Stories */}
                    <button 
                      onClick={() => setShowStoryCard(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                      <Camera size={20} />
                      Tarjeta para Historia
                    </button>

                    <div className="h-2"></div>
                    
                    <button 
                      onClick={() => setLastContribution(null)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-all border border-white/5 text-sm"
                    >
                      Volver / Nuevo Aporte
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA: RANKING */}
          {view === 'ranking' && (
            <div className="animate-fade-in pb-20">
              <h2 className="text-center font-serif text-amber-200/80 mb-6 flex items-center justify-center gap-2 drop-shadow-md">
                <Award size={20} /> Ranking de Países
              </h2>
              <div className="space-y-3">
                {stats.ranking.map((item, idx) => (
                  <div key={item.name} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-center p-4 bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-xl shadow-sm">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-serif font-bold text-lg mr-4 shadow-lg ${
                        idx === 0 ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-400/50' : 
                        idx === 1 ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-400/50' :
                        idx === 2 ? 'bg-orange-700 text-orange-100 ring-2 ring-orange-600/50' : 
                        'bg-slate-800 text-slate-500 border border-white/10'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-serif font-bold text-slate-100 text-lg flex items-center justify-between">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <BookOpen size={10} /> {item.rosaries}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <MapPin size={10} /> {item.km}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.ranking.length === 0 && (
                  <div className="text-center py-12 text-slate-500 font-serif italic bg-slate-900/30 rounded-xl border border-white/5">
                    Sé el primero en registrar un aporte.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA: HISTORIAL */}
          {view === 'history' && (
            <div className="animate-fade-in pb-20">
               <h2 className="text-center font-serif text-sky-200/80 mb-6 flex items-center justify-center gap-2 drop-shadow-md">
                <Activity size={20} /> Actividad Reciente
              </h2>
              <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-0 before:w-0.5 before:bg-white/10">
                {contributions.slice(0, 30).map((c, i) => (
                  <div key={c.id} className="relative pl-10">
                    <div className={`absolute left-[11px] top-4 w-3 h-3 rounded-full border-2 border-slate-900 shadow-[0_0_10px_currentColor] ${
                      c.type === 'rosario' ? 'bg-amber-500 text-amber-500' : 'bg-emerald-500 text-emerald-500'
                    }`}></div>
                    <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-sm hover:bg-slate-900/60 transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 block flex items-center gap-1">
                          <Globe size={10} /> {c.country}
                        </span>
                        <span className={`text-lg font-serif font-bold ${c.type === 'rosario' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          +{c.amount} {c.type === 'rosario' ? 'Rosarios' : 'Km'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        Hace un momento
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* NAVBAR MOBILE */}
      <nav className="fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around p-1 shadow-2xl z-40">
        <button onClick={() => setView('input')} className={`flex flex-col items-center p-3 rounded-xl transition-all w-full ${view === 'input' ? 'text-sky-300 bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
          <Activity size={24} strokeWidth={view === 'input' ? 2.5 : 1.5} />
        </button>
        <button onClick={() => setView('ranking')} className={`flex flex-col items-center p-3 rounded-xl transition-all w-full ${view === 'ranking' ? 'text-amber-300 bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
          <TrendingUp size={24} strokeWidth={view === 'ranking' ? 2.5 : 1.5} />
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center p-3 rounded-xl transition-all w-full ${view === 'history' ? 'text-emerald-300 bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
          <BookOpen size={24} strokeWidth={view === 'history' ? 2.5 : 1.5} />
        </button>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        .font-serif { font-family: 'Lora', serif; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}