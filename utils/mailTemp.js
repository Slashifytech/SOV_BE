


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

<p>Thank you for signing up with Sov Portal! To complete your Student account setup, please verify your email address by using the One-Time Password (OTP) provided below.</p>

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

export const studentOfferLetterApprovedTemp = (firstName, collegeName, country, courseName)=>{
  return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Congratulations! We are excited to inform you that your offer letter from <strong>${collegeName}</strong> in <strong>${country}</strong> for the <strong>${courseName}</strong> program has been approved.</p>

<p>To secure your spot in this program, please proceed with the payment for the offer letter as soon as possible.</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li><strong>Review the Offer Letter:</strong> You can access your approved offer letter in the portal.</li>
  <li><strong>Complete the Payment:</strong> Please follow the payment instructions provided in your offer letter to confirm your admission.</li>
</ul>

<p>If you need assistance with the payment process or have any questions, please contact our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>We’re thrilled to support you as you take this important step toward achieving your educational goals. Please complete the payment soon to ensure your place at <strong>${collegeName}</strong>.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Helping you make your study abroad dreams a reality</p>
`;
}

export const studentOfferLetterRejectedTemp =  (firstName,collegeName, country, courseName, rejectionReason )=>{
     return `<p>Dear <strong>${firstName}</strong>,</p>

<p>Thank you for applying to <strong>${collegeName}</strong> in <strong>${country}</strong> for the <strong>${courseName}</strong> program. Unfortunately, your offer letter has been rejected.</p>

<p><strong>Reason for Rejection:</strong></p>
<p>${rejectionReason}</p>

<p>You can modify or edit your offer letter based on the reason above and resubmit it for reconsideration.</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li><strong>Review and update your application:</strong> Address the issue that led to the rejection.</li>
  <li><strong>Resubmit the offer letter:</strong> Once you have made the necessary changes, resubmit your offer letter for approval.</li>
</ul>

<p>Our team is here to assist you if you need help with the resubmission process. Please contact us at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>We encourage you to make the required changes and resubmit soon. We are committed to helping you secure your place at <strong>${collegeName}</strong> and achieve your study abroad dreams.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Supporting you on your path to higher education abroad</p>
`
}


export const agentOfferLetterApproved = (agentFirstName, studentName, collegeName, country, courseName )=>{
  return `<p>Dear <strong>${agentFirstName}</strong>,</p>

<p>We are pleased to inform you that the offer letter for <strong>${studentName}</strong> has been approved by <strong>${collegeName}</strong> in <strong>${country}</strong> for the <strong>${courseName}</strong> program.</p>

<p><strong>Student Details:</strong></p>
<ul>
  <li><strong>Student ID:</strong> ${studentId}</li>
  <li><strong>Student Name:</strong> ${studentName}</li>
  <li><strong>College Name:</strong> ${collegeName}</li>
  <li><strong>Course Name:</strong> ${courseName}</li>
  <li><strong>Country:</strong> ${countryName}</li>
</ul>

<p>You can now log in to your agent portal and access the approved offer letter. Please follow the next steps, including providing payment instructions to the student or any other necessary actions.</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li><strong>Access the Offer Letter:</strong> You can download and review the offer letter through your agent dashboard.</li>
  <li><strong>Notify the Student:</strong> Ensure that the student is informed about the approval and take the next steps, including the payment for the offer letter, if required.</li>
</ul>

<p>If you have any questions or need further assistance, please contact us at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>We appreciate your partnership and look forward to helping your student successfully proceed with their application.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Empowering agents to help students achieve their study abroad goals</p>
`
}

export const agentOfferLetterRejected = (agentFirstName, studentName, collegeName, country, courseName, rejectionReason)=>{
  return `<p>Dear <strong>${agentFirstName}</strong>,</p>

<p>We regret to inform you that the offer letter for <strong>${studentName}</strong> has been rejected by <strong>${collegeName}</strong> in <strong>${country}</strong> for the <strong>${courseName}</strong> program.</p>

<p><strong>Student Details:</strong></p>
<ul>
  <li><strong>Student ID:</strong> ${studentId}</li>
  <li><strong>Student Name:</strong> ${studentName}</li>
  <li><strong>College Name:</strong> ${collegeName}</li>
  <li><strong>Course Name:</strong> ${courseName}</li>
  <li><strong>Country:</strong> ${countryName}</li>
</ul>

<p><strong>Reason for Rejection:</strong></p>
<p>${rejectionReason}</p>

<p>As the agent handling this application, you can modify or update the details that led to the rejection and resubmit the offer letter for further review.</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li><strong>Log in to the portal</strong></li>
  <li><strong>Review and modify:</strong> Update the necessary details mentioned in the rejection reason.</li>
  <li><strong>Resubmit the offer letter:</strong> Once the required changes have been made, resubmit the offer letter for approval.</li>
</ul>

<p>If you have any questions or require assistance with the modifications, please feel free to contact us at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>We appreciate your attention to this matter and look forward to helping your student proceed with their application.</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Partnering with you to help students achieve their study abroad dreams</p>

`;
}


export const agentPasswordResetEmail = (agentFirstName, otpCode) => {
  return `<p>Dear <strong>${agentFirstName}</strong>,</p>

<p>We received a request to reset your password for your agent account on Sov Portal. To proceed, please verify your identity by entering the OTP (One-Time Password) provided below:</p>

<p><strong>Your OTP:</strong> <strong>${otpCode}</strong></p>

<p>If you did not request a password reset, please ignore this email or contact our support team immediately.</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li>Enter the OTP on the password reset page.</li>
  <li>Once verified, you’ll be able to set a new password.</li>
</ul>

<p>For security reasons, do not share this OTP with anyone. If you need further assistance, please reach out to our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>Thank you for using Sov Portal!</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Your trusted partner in study visa solutions</p>
`;
};


export const studentPasswordResetEmail = (otpCode) => {
  return `<p>Dear Student</p>

<p>We received a request to reset your password for your student account on Sov Portal. To proceed, please verify your identity by entering the OTP (One-Time Password) provided below:</p>

<p><strong>Your OTP:</strong> <strong>${otpCode}</strong></p>

<p>If you did not request a password reset, please ignore this email or contact our support team immediately.</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li>Enter the OTP on the password reset page.</li>
  <li>Once verified, you’ll be able to set a new password.</li>
</ul>

<p>For security reasons, do not share this OTP with anyone. If you need further assistance, please reach out to our support team at <a href="mailto:support@sovportal.in">support@sovportal.in</a>.</p>

<p>Thank you for using Sov Portal!</p>

<p>Best regards,</p>
<p><strong>Sov Portal</strong><br>
Supporting you on your study abroad journey</p>
`;
};







// =============================


