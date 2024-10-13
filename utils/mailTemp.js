


export const agentSignUpTemp = (firstName, otp)=>{
    
    return `
      <p>Dear <strong>${firstName}</strong>,</p>
      <p>Thank you for registering with Sov Portal! To complete your Agent account setup, please verify your email address by using the One-Time Password (OTP) provided below.</p>
      <p><strong>Your OTP: ${otp}</strong></p>
      <p>Please enter this code in the required field on our website. This OTP is valid for the next 1 minute and can only be used once.</p>
      <p>If you did not initiate this request, please ignore this email.</p>
      <p>If you need any assistance, feel free to contact our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>
      <p>Best regards,<br/>Sov Portal<br/>Helping you make your study abroad dreams come true!</p>
    `;
}

export const agentAccountCredentials = (firstName, email, password) =>{
  return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Congratulations! Your email has been successfully verified, and your agent sign-up account on Sov Portal is now active.</p>

<p>Here are your login credentials:</p>
<ul>
  <li><strong>Website Link:</strong> <a href="https://sovportal.in">sovportal.in</a></li>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Password:</strong> ${password}</li>
</ul>

<p>You can now log in and complete your registration process.</p>

<p>If you face any issues or need assistance, feel free to reach out to our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>Thank you for partnering with us. We look forward to helping you assist students in their study abroad journey!</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Supporting your success in global education</p>
`;
}

export const studentSignUpTemp = (firstName, otp)=>{
  return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Thank you for registering with Sov Portal! To complete your Student account setup, please verify your email address by using the One-Time Password (OTP) provided below.</p>

<p><strong>Your OTP: ${otp}</strong></p>

<p>Please enter this code in the required field on our website. This OTP is valid for the next 1 minute and can only be used once.</p>

<p>If you did not initiate this request, please ignore this email.</p>

<p>If you need any assistance, feel free to contact our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Helping you make your study abroad dreams come true!</p>
`;
}

export const studentAccountCredentials = (firstName, email, password)=>{
  return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Congratulations! Your email has been successfully verified, and your student sign-up account on Sov Portal is now active.</p>

<p>Here are your login credentials:</p>
<ul>
  <li><strong>Website Link:</strong> <a href="https://sovportal.in">sovportal.in</a></li>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Password:</strong> ${password}</li>
</ul>

<p>You can now log in and complete your registration process.</p>

<p>If you face any issues or need assistance, feel free to reach out to our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>Thank you for partnering with us. We look forward to helping you assist students in their study abroad journey!</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Supporting your success in global education</p>
`;
}

export const agentRegistrationComplete = (firstName)=>{
    return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Thank you for registering as an agent on Sov Portal! We have successfully received your details and completed your registration process.</p>

<p><strong>What’s Next?</strong></p>
<p>Your account is currently pending approval from our admin team. Once your account is approved, you will be granted access to your agent dashboard, where you can start managing your clients' study visa applications.</p>

<p><strong>Approval Time:</strong> Our team will review your details within the next <strong>[24-48 hours]</strong>. You will receive a confirmation email once your account has been activated.</p>

<p>If you have any questions or require further assistance, please don’t hesitate to reach out to our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>We appreciate your patience and look forward to working with you.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Empowering agents to streamline study visa processes</p>
`;
}

export const studentRegistrationComplete = (firstName)=>{
  return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Thank you for registering as a student on Sov Portal! We have successfully received your details and completed your registration process.</p>

<p><strong>What’s Next?</strong></p>
<p>Your account is now pending approval from our admin team. Once your account is approved, you will gain access to your student dashboard, where you can explore study visa options, track your application status, and access other helpful resources.</p>

<p><strong>Approval Time:</strong> Our team will review your details within the next <strong>[24-48 hours]</strong>. You will receive a confirmation email once your account has been activated.</p>

<p>If you have any questions or require further assistance, please don’t hesitate to reach out to our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>We appreciate your patience and look forward to working with you.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Empowering agents to streamline study visa processes</p>
`;
}