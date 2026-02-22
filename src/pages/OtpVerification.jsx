import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./OtpVerification.css";

const OtpVerification = () => {

  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [expiryTime, setExpiryTime] = useState(null);

  const CORRECT_OTP = "123456"; // demo otp

  useEffect(() => {

    // set expiry time 5 minutes
    const now = new Date().getTime();

    const expiry = now + 5 * 60 * 1000;

    setExpiryTime(expiry);

  }, []);


  const handleSubmit = (e) => {

    e.preventDefault();

    const now = new Date().getTime();

    if (now > expiryTime) {

      setMessage("OTP expired.");

      return;
    }

    if (otp === CORRECT_OTP) {

      setMessage("Account created successfully.");

      setTimeout(() => {

        navigate("/dashboard");

      }, 2000);

    }

    else {

      setMessage("Invalid OTP.");

    }

  };


  return (

    <div className="otp-container">

      <div className="otp-card">

        <h2>Email Verification</h2>

        <p>Enter the 6 digit OTP sent to your email</p>

        <form onSubmit={handleSubmit}>

          <input

            type="text"

            maxLength="6"

            value={otp}

            onChange={(e) => setOtp(e.target.value)}

            placeholder="Enter OTP"

            required

          />

          <button type="submit">

            Verify OTP

          </button>

        </form>

        {message && (

<p className={`otp-message ${
message.includes("successfully")
? "success"
: "error"
}`}>

            {message}

          </p>

        )}

      </div>

    </div>

  );

};

export default OtpVerification;