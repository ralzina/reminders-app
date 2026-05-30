import axiosModule = require('axios');
const dotenv = require('dotenv')
const path = require('path')
dotenv.config({path: path.resolve(__dirname, '../../.env') });

const axios = axiosModule as any;

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

const sendWhatAppMessage = async (to: string, message: string): Promise<void> => {
    if(!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error("Missing WhatsApp configuration keys in .env");
        return;
    }

    const cleanPhone = to.replace(/D/g, '');

    const url = `https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const data = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: "task_reminder_alert",
            language: {
                code: "en"
            },
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: message
                        }
                    ]
                }
            ]
        }
    };

    try {
        const response = await axios.default.post(url, data, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 || response.status === 201) {
            console.log('Whtasapp message sent');
        }
    } catch (error: any) {
        console.error("Meta Cloud API connection failure:");
        if (error.response) {
            console.error("Payload error:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("Error message:", error.message);
        }
    }
}

export = sendWhatAppMessage;