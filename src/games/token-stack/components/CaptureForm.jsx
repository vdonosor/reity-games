import { useState } from 'react';
import { validateEmail } from '../engine/validators.js';

export function CaptureForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ nombre: '', email: '', consent: false });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Nombre requerido';
    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) errs.email = 'Email inválido';
    if (!form.consent) errs.consent = 'Debes aceptar para continuar';
    return { errs, emailNorm: emailResult.normalized };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { errs, emailNorm } = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ nombre: form.nombre.trim(), email: emailNorm, consent: true });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-950 px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-green-400 text-xs font-semibold tracking-widest uppercase mb-2">Reity SpA</p>
          <h1 className="text-white text-3xl font-extrabold leading-tight">Token Stack</h1>
          <p className="text-gray-400 text-sm mt-2">Registrate para competir por el premio del día</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            label="Nombre completo"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            error={errors.nombre}
            placeholder="Ej: Sofía Martínez"
            autoComplete="name"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="tu@email.com"
            autoComplete="email"
          />
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 accent-green-500 shrink-0"
              />
              <span className="text-gray-400 text-xs leading-relaxed">
                Acepto que Reity SpA me contacte comercialmente con información sobre tokenización inmobiliaria.
              </span>
            </label>
            {errors.consent && <p className="text-red-400 text-xs mt-1">{errors.consent}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            {loading ? 'Cargando...' : '¡Jugar!'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type, value, onChange, error, placeholder, autoComplete, inputMode }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`w-full bg-gray-800 text-white placeholder-gray-600 border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-700'
        }`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
