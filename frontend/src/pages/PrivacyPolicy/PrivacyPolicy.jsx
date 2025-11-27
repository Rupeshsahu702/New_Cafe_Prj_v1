import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <h1>Privacy Policy</h1>

        <p>
          At <b>Momo Magic Cafe</b>, your privacy matters. We collect only the information needed to
          process orders, improve your experience, and communicate essential updates.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Contact details you provide (name, phone number, email).</li>
          <li>Order details and delivery address when you place an order.</li>
          <li>Basic usage analytics to keep the site running smoothly.</li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>To confirm orders, process payments, and provide customer support.</li>
          <li>To improve menu discovery, performance, and reliability.</li>
          <li>To send operational notifications (e.g., order status).</li>
        </ul>

        <h2>Payments</h2>
        <p>
          Card and UPI details are handled by secure payment partners. We never store your full card
          data on our servers.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your data. Limited information may be shared with service providers strictly
          for order processing, delivery, and security.
        </p>

        <h2>Your choices</h2>
        <p>
          You can request correction or deletion of your data by emailing
          {' '}<b>Khomesh1008sahu@gmail.com</b>. We’ll verify the request before acting on it.
        </p>

        <h2>Updates</h2>
        <p>
          This policy may be updated to reflect changes in our services or the law.
          Material changes will be posted here.
        </p>

        <p className="policy-footer-note">
          Questions? Reach us at <b>+91-6262111109</b> or <b>Khomesh1008sahu@gmail.com</b>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
