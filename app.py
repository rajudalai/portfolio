import resend
import os
from typing import Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
load_dotenv()
# Use environment variable for API key with fallback to hardcoded (for dev)
resend.api_key = os.getenv("RESEND_API_KEY")

app = FastAPI(title="Raju Visuals Email API")

# Configure CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Vite dev server
        "http://localhost:3000",      # Alternative dev port
        "https://rajuvisuals.com",    # Production domain
        "https://www.rajuvisuals.com", # Production with www
        "https://rajuvisuals.in",  
        "https://www.rajuvisuals.in",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ PYDANTIC MODELS ============

class ContactFormRequest(BaseModel):
    from_name: str
    from_email: EmailStr
    subject: str
    message: str
    email_enabled: bool = True  # Default to enabled


class ContactFormResponse(BaseModel):
    success: bool
    message: str
    skipped: bool = False
    error: Optional[str] = None


# ============ EMAIL TEMPLATES ============

def get_user_confirmation_html(name: str) -> str:
    """Generate HTML email for user confirmation."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @keyframes fadeInDown {{
                from {{
                    opacity: 0;
                    transform: translateY(-20px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            
            @keyframes fadeInUp {{
                from {{
                    opacity: 0;
                    transform: translateY(20px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            
            @keyframes fadeIn {{
                from {{
                    opacity: 0;
                }}
                to {{
                    opacity: 1;
                }}
            }}
            
            @keyframes pulse {{
                0%, 100% {{
                    transform: scale(1);
                }}
                50% {{
                    transform: scale(1.05);
                }}
            }}
            
            @keyframes slideInRight {{
                from {{
                    opacity: 0;
                    transform: translateX(-30px);
                }}
                to {{
                    opacity: 1;
                    transform: translateX(0);
                }}
            }}
            
            .animate-header {{
                animation: fadeInDown 0.8s ease-out;
            }}
            
            .animate-content {{
                animation: fadeInUp 0.8s ease-out 0.2s both;
            }}
            
            .animate-box {{
                animation: slideInRight 0.8s ease-out 0.4s both;
            }}
            
            .animate-button {{
                animation: fadeIn 0.8s ease-out 0.6s both;
            }}
            
            .animate-footer {{
                animation: fadeInUp 0.8s ease-out 0.7s both;
            }}
            
            .button-hover {{
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }}
            
            .button-hover:hover {{
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(155, 92, 255, 0.4) !important;
            }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #9B5CFF 0%, #7C3FCC 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                    Thanks for Reaching Out! 🎬
                </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <p style="color: #333333; font-size: 18px; line-height: 1.8; margin: 0 0 20px 0;">
                    Hi <strong style="color: #9B5CFF;">{name}</strong>,
                </p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                    Your message has been successfully received! I appreciate you taking the time to connect with me.
                </p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                    I'll review your inquiry and get back to you within <strong>24-48 hours</strong>. 
                    If your project is time-sensitive, feel free to mention that in your message.
                </p>
                
                <!-- CTA Box -->
                <div style="background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 100%); border-left: 4px solid #9B5CFF; padding: 20px; border-radius: 8px; margin: 30px 0;">
                    <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">
                        <strong>While you wait...</strong>
                    </p>
                    <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0;">
                        Check out my portfolio and latest projects to see what I can bring to your vision.
                    </p>
                </div>
                
                <!-- Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://rajuvisuals.com" style="display: inline-block; background: linear-gradient(135deg, #9B5CFF 0%, #7C3FCC 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(155, 92, 255, 0.3);">
                    View Portfolio →
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 30px; border-top: 1px solid #e8e8e8;">
                <p style="color: #333333; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">
                    Best regards,
                </p>
                <p style="color: #555555; font-size: 15px; margin: 0 0 4px 0;">
                    <strong>Raju Dalai</strong>
                </p>
                <p style="color: #888888; font-size: 14px; margin: 0;">
                    Video Editor & Motion Graphics Artist
                </p>
            </div>
            
            <!-- Bottom bar -->
            <div style="background-color: #9B5CFF; padding: 15px; text-align: center;">
                <p style="color: #ffffff; font-size: 12px; margin: 0; opacity: 0.9;">
                    © 2024 Raju Visuals. All rights reserved.
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """


def get_admin_notification_html(name: str, email: str, subject: str, message: str) -> str:
    """Generate HTML email for admin notification."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #9B5CFF 0%, #7C3FCC 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">
                    📬 New Contact Form Submission
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                    Received from rajuvisuals.com
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 35px 30px;">
                
                <!-- Contact Info Card -->
                <div style="background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 100%); border-radius: 10px; padding: 25px; margin-bottom: 25px; border: 1px solid #e8d9ff;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">From</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 0 16px 0;">
                                <span style="color: #333333; font-size: 18px; font-weight: 600;">{name}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-top: 1px solid rgba(155, 92, 255, 0.2);">
                                <span style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Email</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 0 16px 0;">
                                <a href="mailto:{email}" style="color: #9B5CFF; font-size: 16px; text-decoration: none; font-weight: 500;">{email}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-top: 1px solid rgba(155, 92, 255, 0.2);">
                                <span style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Subject</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0;">
                                <span style="color: #333333; font-size: 16px; font-weight: 500;">{subject}</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Message Card -->
                <div style="background-color: #ffffff; border: 2px solid #e8e8e8; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
                    <div style="margin-bottom: 12px;">
                        <span style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Message</span>
                    </div>
                    <div style="color: #333333; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">{message}</div>
                </div>
                
                <!-- Quick Action Button -->
                <div style="text-align: center; margin-top: 30px;">
                    <a href="mailto:{email}" style="display: inline-block; background: linear-gradient(135deg, #9B5CFF 0%, #7C3FCC 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(155, 92, 255, 0.3);">
                        Reply to {name} →
                    </a>
                </div>
                
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e8e8e8; text-align: center;">
                <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                    This email was automatically generated from the contact form at<br>
                    <a href="https://rajuvisuals.com" style="color: #9B5CFF; text-decoration: none; font-weight: 500;">rajuvisuals.com</a>
                </p>
            </div>
            
        </div>
    </body>
    </html>
    """


# ============ API ENDPOINTS ============

@app.get("/")
def health_check() -> Dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "Raju Visuals Email API"}


@app.post("/api/contact", response_model=ContactFormResponse)
async def send_contact_emails(form: ContactFormRequest) -> ContactFormResponse:
    """
    Handle contact form submissions.
    
    Sends two emails:
    1. Confirmation email to the user
    2. Notification email to the admin (contact@rajuvisuals.com)
    
    If email_enabled is False, skips sending but returns success.
    """
    
    # If emails are disabled, skip sending
    if not form.email_enabled:
        return ContactFormResponse(
            success=True,
            message="Email sending is disabled. Form data saved.",
            skipped=True
        )
    
    try:
        # Send confirmation email to user
        user_email_params: resend.Emails.SendParams = {
            "from": "Raju Visuals <reply@rajuvisuals.com>",
            "to": [form.from_email],
            "subject": "Thanks for reaching out! 🎬",
            "html": get_user_confirmation_html(form.from_name),
        }
        resend.Emails.send(user_email_params)
        
        # Send notification email to admin
        admin_email_params: resend.Emails.SendParams = {
            "from": "Contact Form <reply@rajuvisuals.com>",
            "to": ["contact@rajuvisuals.com"],
            "reply_to": form.from_email,
            "subject": f"New Contact: {form.subject}",
            "html": get_admin_notification_html(
                form.from_name,
                form.from_email,
                form.subject,
                form.message
            ),
        }
        resend.Emails.send(admin_email_params)
        
        return ContactFormResponse(
            success=True,
            message="Emails sent successfully"
        )
        
    except Exception as e:
        # Log the error for debugging
        print(f"Email sending error: {str(e)}")
        
        # Return error response (don't raise HTTPException so form still saves)
        return ContactFormResponse(
            success=False,
            message="Failed to send emails",
            error=str(e)
        )