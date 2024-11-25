import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const client = new Client();

client.on('qr', (qr) => {
    // Generate and display the QR code for WhatsApp login
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    // Handle AI conversation
    if (msg.body.startsWith('')) {
        const userMessage = msg.body.trim();

        const greetings = [
            'selamat pagi',
            'selamat siang',
            'selamat sore',
            'selamat malam',
            'halo',
            'hai'
        ];
    
        const lowerMessage = userMessage.toLowerCase();
        const matchedGreeting = greetings.find(greet => lowerMessage.includes(greet));
    
        if (matchedGreeting) {
            msg.reply(`Halo, ${matchedGreeting}! Ada yang bisa saya bantu hari ini?`);
            return; // Hentikan proses lebih lanjut jika sudah menjawab sapaan
        }

        // Initialize the AI model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Create a new chat session
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: 
        `##Tentang
        Kamu adalah customer service dari sebuah bank bernama Bank Mandiri, yang berfokus pada layanan perbankan untuk nasabah individu dan bisnis di Indonesia.

        ##Tugas
        Tugas kamu adalah menjawab pertanyaan terkait produk dan layanan perbankan, seperti rekening tabungan, deposito, pinjaman, kartu kredit, dan layanan perbankan digital. Kamu hanya menjawab dalam 1 paragraf saja dengan bahasa Indonesia yang sopan dan ramah tanpa emoticon.

        ##FAQ
        1. Bagaimana cara membuka rekening tabungan?
        2. Apa saja syarat pengajuan pinjaman?
        3. Apa keuntungan menggunakan layanan digital Bank Mandiri?
        
        ##Panggilan
        Selalu panggil dengan "Bapak/Ibu" untuk menjaga kesopanan, atau gunakan nama nasabah jika telah disebutkan. Hindari menggunakan sapaan informal seperti "Kamu" atau "Anda".

        ##Batasan
        Jawab hanya yang kamu tahu saja. Jika pertanyaan di luar kapasitasmu atau memerlukan informasi lebih lanjut, arahkan nasabah untuk menghubungi call center di 1500123 atau email ke cs@bankmandiri.id.

        ##Rekomendasi
        Kamu juga dapat memberikan rekomendasi produk perbankan sesuai kebutuhan nasabah jika mereka menanyakannya. Tanyakan dulu tujuan keuangan mereka, apakah untuk tabungan, investasi, atau pinjaman, kemudian cocokkan dengan produk yang relevan dari data yang kamu punya. Rekomendasikan setidaknya 3 produk yang sesuai dengan kebutuhan nasabah.
`
                        },
                    ],
                },
                {
                    role: "model",
                    parts: [
                        { 
                            text: `Halo Bapak/Ibu, saya adalah customer service dari Bank Mandiri. Silakan tanyakan apa saja yang ingin Bapak/Ibu ketahui mengenai produk atau layanan perbankan kami, seperti tabungan, deposito, pinjaman, atau layanan digital. Saya siap membantu!`
                        },
                    ],
                }
            ],
            generationConfig: {
                maxOutputTokens: 200,
            },
        });        


        try {
            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            const text = await response.text();

            // Reply to the user on WhatsApp
            msg.reply(`CS:\n${text}`);
        } catch (error) {
            console.error('Terjadi kesalahan dalam respons CS:', error);
            msg.reply('Maaf, terjadi kesalahan saat memproses permintaan. Sepertinya API Key belum terpasang');
        }
    }

    // Echo message handler
    if (msg.body.startsWith('!echo ')) {
        msg.reply(msg.body.slice(6));
    }

    // Ping handler
    if (msg.body === '!ping') {
        msg.reply('pong');
    }

    // Media information handler
    if (msg.body === '!mediainfo' && msg.hasMedia) {
        const attachmentData = await msg.downloadMedia();
        msg.reply(`
            *Media Info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename || 'unknown'}
            Data Length: ${attachmentData.data.length} bytes
        `);
    }
});

client.initialize();
