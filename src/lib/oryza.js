export async function chatOryza({
    prompt,
    imageDataUrl,
    model,
    signal
}) {
    const baseURL =
        import.meta.env.VITE_OPENROUTER_BASE_URL;
    const apiKey =
        import.meta.env.VITE_OPENROUTER_API_KEY;
    const referer =
        import.meta.env.VITE_APP_REFERER || window.location.href;
    const title =
        import.meta.env.VITE_APP_TITLE || 'ORYZA Plant Disease AI';
    const chosenModel = model ||
        import.meta.env.VITE_OPENROUTER_MODEL;

    if (!apiKey) {
        throw new Error('Missing VITE_OPENROUTER_API_KEY environment variable');
    }

    // ✅ SISTEM PROMPT TANPA MARKDOWN - Lebih konsisten
    const systemPrompt = `Anda adalah ORYZA, AI Specialist Diagnosis Penyakit Tanaman yang ahli dalam:

KEAHLIAN UTAMA:
- Diagnosa penyakit tanaman melalui analisis gambar dan gejala
- Identifikasi hama, jamur, bakteri, virus pada tanaman
- Analisis kondisi nutrisi dan defisiensi tanaman
- Rekomendasi treatment dan pencegahan

FORMAT DIAGNOSIS:
1. IDENTIFIKASI PENYAKIT: Nama penyakit (% kepercayaan)
2. TINGKAT KEPARAHAN: Ringan/Sedang/Berat
3. PENYEBAB: Jamur/Bakteri/Virus/Hama/Nutrisi
4. GEJALA UTAMA: Deskripsi visual yang terdeteksi
5. STADIUM: Awal/Berkembang/Lanjut/Kritis

REKOMENDASI TREATMENT:
- Organik: Solusi ramah lingkungan
- Kimia: Fungisida/pestisida spesifik
- Budidaya: Perubahan pola tanam/perawatan
- Pencegahan: Tips mencegah penyebaran

JENIS TANAMAN YANG DIDUKUNG:
Padi, jagung, tomat, cabai, kentang, kedelai, wortel, kubis, dan tanaman holtikultura lainnya.

INSTRUKSI PENTING:
- Gunakan format yang jelas dan terstruktur
- Berikan diagnosis berdasarkan evidence
- Jika gambar tidak jelas, minta foto yang lebih baik
- Sertakan confidence level untuk setiap diagnosis
- Berikan saran praktis yang bisa diterapkan petani
- Gunakan bahasa yang mudah dipahami
- Jika tidak yakin, sarankan konsultasi ahli

ATURAN FORMAT RESPON:
- Gunakan angka untuk numbering (1. 2. 3.)
- Gunakan tanda minus untuk bullet points (-)
- Gunakan huruf tebal dengan format **text** untuk emphasis
- Gunakan heading dengan format ### untuk judul bagian
- Berikan respon yang terstruktur dan mudah dibaca

Jawab dalam format yang terstruktur dan praktis untuk petani Indonesia.`;

    // Enhanced prompt untuk diagnosis penyakit tanaman
    const enhancedPrompt = imageDataUrl ?
        `${prompt ? prompt + '\n\n' : ''}Tolong analisis foto tanaman ini dan berikan diagnosis lengkap sesuai format yang telah ditentukan. Fokus pada:
        
        ANALISIS GAMBAR:
        - Identifikasi bagian tanaman (daun, batang, buah, akar)
        - Deteksi gejala visual (bercak, layu, perubahan warna, kerusakan)
        - Pola penyebaran penyakit
        - Kondisi lingkungan yang terlihat
        
        FAKTOR LINGKUNGAN:
        - Kelembaban yang terlihat
        - Tanda-tanda cuaca ekstrem
        - Kondisi tanah (jika terlihat)
        
        Berikan diagnosis yang detail dan actionable untuk petani.` :
        `GEJALA/PERTANYAAN: ${prompt}
        
        Berikan diagnosis dan saran berdasarkan gejala yang disebutkan. Jika perlu foto untuk diagnosis yang akurat, mohon sampaikan dengan sopan.`;

    const content = [{
        type: 'text',
        text: enhancedPrompt
    }];

    if (imageDataUrl) {
        content.push({
            type: 'image_url',
            image_url: {
                url: imageDataUrl,
                detail: 'high'
            }
        });
    }

    const body = {
        model: chosenModel,
        messages: [{
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content
            }
        ],
        temperature: 0.2, // ✅ LEBIH RENDAH untuk konsistensi format
        max_tokens: 2000,
        top_p: 0.8 // ✅ LEBIH RENDAH untuk konsistensi
    };

    const res = await fetch(baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'HTTP-Referer': referer,
            'X-Title': title,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal
    });

    if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) {
            throw new Error('Terlalu banyak permintaan. Tunggu sebentar dan coba lagi.');
        } else if (res.status === 401) {
            throw new Error('API key tidak valid. Periksa konfigurasi ORYZA.');
        } else if (res.status === 400) {
            throw new Error('Format permintaan tidak valid. Coba upload gambar yang berbeda.');
        } else {
            throw new Error(`Error ${res.status}: ${errText || 'Gagal menghubungi layanan AI'}`);
        }
    }

    const json = await res.json();
    let contentOut = '';

    if (json && json.choices && Array.isArray(json.choices)) {
        const first = json.choices[0];
        if (first && first.message && typeof first.message.content === 'string') {
            contentOut = first.message.content;

            // ✅ POST-PROCESSING untuk memastikan format yang konsisten
            if (contentOut && imageDataUrl) {
                contentOut += `\n\n### Catatan Penting\nDiagnosis ini berdasarkan analisis gambar AI. Untuk kepastian 100%, disarankan konsultasi dengan ahli pertanian setempat.`;
            }
        }
    }

    // ✅ FALLBACK dengan format yang konsisten
    if (!contentOut.trim()) {
        if (imageDataUrl) {
            contentOut = '### Gambar Tidak Dapat Dianalisis\n\nMaaf, saya tidak dapat menganalisis gambar ini dengan baik.\n\n**Saran:**\n- Upload foto yang lebih jelas\n- Pastikan pencahayaan yang baik\n- Fokus pada bagian tanaman yang bermasalah\n- Hindari gambar yang buram atau gelap';
        } else {
            contentOut = '### Informasi Tidak Cukup\n\nMaaf, saya tidak dapat memproses pertanyaan Anda.\n\n**Mohon berikan:**\n- Deskripsi gejala yang lebih detail\n- Foto tanaman yang jelas\n- Informasi jenis tanaman\n- Kondisi lingkungan terkini';
        }
    }

    return contentOut;
}

// Helper functions tetap sama
export function validatePlantImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
        throw new Error('Format gambar harus JPG, PNG, atau WebP');
    }

    if (file.size > maxSize) {
        throw new Error('Ukuran gambar maksimal 10MB');
    }

    return true;
}

export function resizeImage(file, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(resolve, 'image/jpeg', quality);
        };

        img.src = URL.createObjectURL(file);
    });
}