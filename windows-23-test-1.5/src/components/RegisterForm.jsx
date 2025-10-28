import { useState } from "react";
import { initSupabase } from "../lib/supabaseClient"; // use the async init

export default function RegisterForm({ onRegister }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);

  const generateCode = () =>
    crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

  const handleRegister = async () => {
    if (!email || !username || !password) {
      setMessage("⚠️ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const codeValue = generateCode();
      setGeneratedCode(codeValue);

      if (twoStepEnabled) {
        const res = await fetch("/.netlify/functions/sendVerification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, code: codeValue }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setMessage(`❌ Failed to send verification email: ${data.error}`);
          setLoading(false);
          return;
        }
      }

      setStep(2);
      setMessage(`✅ Verification code generated! Enter it below.`);
    } catch (err) {
      console.error(err);
      setMessage("❌ Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      setMessage("⚠️ Please enter your verification code.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (code.toUpperCase() === generatedCode) {
        // Initialize Supabase client
        const supabase = await initSupabase();
        if (!supabase) {
          setMessage("❌ Supabase not initialized.");
          setLoading(false);
          return;
        }

        // Insert verified user into Supabase
        const { error } = await supabase.from("users").insert([
          {
            email,
            username,
            password, // plain text for now (consider hashing later)
            two_step_enabled: twoStepEnabled,
          },
        ]);

        if (error) {
          console.error(error);
          setMessage("❌ Failed to save user in Supabase.");
          setLoading(false);
          return;
        }

        onRegister({ email, username, twoStepEnabled });
        setMessage("✅ Verified and saved! Registration complete.");
      } else {
        setMessage("❌ Verification failed. Check your code.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form" style={containerStyle}>
      {step === 1 && (
        <div>
          <h2>Register for WebBro OS</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={inputStyle}
          />

          <div style={{ marginTop: 10, fontSize: "14px" }}>
            <label>
              <input
                type="checkbox"
                checked={twoStepEnabled}
                onChange={() => setTwoStepEnabled((s) => !s)}
                disabled={loading}
              />{" "}
              Enable 2-Step Email Verification
            </label>
          </div>

          <button onClick={handleRegister} disabled={loading} style={buttonStyle}>
            {loading ? "Registering..." : "Register & Generate Verification"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Enter Verification Code</h2>
          <input
            type="text"
            placeholder="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
          <button onClick={handleVerify} disabled={loading} style={buttonStyle}>
            {loading ? "Verifying..." : "Verify & Complete Registration"}
          </button>
          <button
            onClick={() => {
              setStep(1);
              setMessage("");
              setCode("");
            }}
            disabled={loading}
            style={{ ...buttonStyle, marginLeft: 10 }}
          >
            Back
          </button>
        </div>
      )}

      {message && (
        <p
          style={{
            marginTop: "15px",
            fontSize: "14px",
            color: message.startsWith("✅") ? "#0f0" : "#ff5555",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const containerStyle = {
  textAlign: "center",
  marginTop: "60px",
  background: "rgba(0, 0, 0, 0.7)",
  color: "#fff",
  padding: "30px",
  borderRadius: "10px",
  width: "350px",
  marginLeft: "auto",
  marginRight: "auto",
  boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #555",
  background: "#111",
  color: "#fff",
  outline: "none",
};

const buttonStyle = {
  padding: "10px 20px",
  background: "cyan",
  color: "#000",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};
