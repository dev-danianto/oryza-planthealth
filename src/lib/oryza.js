export async function chatEdutora({
    prompt,
    imageDataUrl,
    model,
    signal
}) {
    const baseURL = import.meta.env.VITE_OPENROUTER_BASE_URL;
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const referer = import.meta.env.VITE_APP_REFERER || window.location.href;
    const title = import.meta.env.VITE_APP_TITLE || 'EDUTORA AI Learning Assistant';
    const chosenModel = model || import.meta.env.VITE_OPENROUTER_MODEL;

    if (!apiKey) {
        throw new Error('Missing VITE_OPENROUTER_API_KEY environment variable');
    }

    // ✅ SISTEM PROMPT UNTUK EDUTORA
    const systemPrompt = `Anda adalah EDUTORA, AI Asisten Belajar Pintar yang didesain untuk membantu pelajar SD, SMP, SMA, hingga Mahasiswa memahami materi pelajaran.

KEAHLIAN UTAMA:
- Matematika & Sains (Fisika, Kimia, Biologi)
- Coding & Algoritma
- Sejarah & Ilmu Sosial
- Bahasa & Sastra
- Analisis Soal & Tugas

GAYA MENGAJAR:
- **Jangan hanya memberi kunci jawaban!** Jelaskan *bagaimana* cara mendapatkan jawaban tersebut (Step-by-step).
- Gunakan bahasa yang suportif, sabar, dan mudah dimengerti (ELI5).
- Gunakan analogi kehidupan nyata untuk menjelaskan konsep abstrak.
- Dorong *Critical Thinking* siswa.

FORMAT JAWABAN:
1. 🎯 **ANALISIS SOAL**: Identifikasi apa yang diketahui dan ditanyakan.
2. 💡 **KONSEP KUNCI**: Rumus/Teori yang digunakan.
3. 📝 **LANGKAH PENYELESAIAN**: Perhitungan/Logika runtut.
4. ✅ **KESIMPULAN**: Jawaban akhir.
5. 📚 **TIPS BELAJAR**: Cara mudah mengingat materi ini.`;

    // Enhanced prompt
    const enhancedPrompt = imageDataUrl ?
        `${prompt ? prompt + '\n\n' : ''}Tolong analisis gambar materi/soal ini dan bantu saya memecahkannya.
        
        INSTRUKSI KHUSUS:
        - JIKA SOAL HITUNGAN: Ekstrak angka, identifikasi variabel, selesaikan step-by-step.
        - JIKA DIAGRAM: Jelaskan komponen visualnya.
        - JIKA TEKS: Buat ringkasan poin kunci.` :
        `PERTANYAAN/MATERI: ${prompt}
        
        Bantu saya mempelajari topik ini. Berikan penjelasan yang komprehensif, terstruktur, dan mudah dipahami sesuai format tutor Edutora.`;

    // ✅ BAGIAN YANG TADI ERROR (FIXED)
    // Pastikan ada kurung kurawal { } di dalam array []
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
        temperature: 0.3,
        max_tokens: 2500,
        top_p: 0.9
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
            throw new Error('Terlalu banyak permintaan. Istirahat sejenak dan coba lagi.');
        } else if (res.status === 401) {
            throw new Error('API key tidak valid. Periksa konfigurasi Edutora.');
        } else if (res.status === 400) {
            throw new Error('Format permintaan tidak valid. Coba gambar yang lebih jelas.');
        } else {
            throw new Error(`Error ${res.status}: ${errText || 'Gagal menghubungi tutor AI'}`);
        }
    }

    const json = await res.json();
    let contentOut = '';

    if (json && json.choices && Array.isArray(json.choices)) {
        const first = json.choices[0];
        if (first && first.message && typeof first.message.content === 'string') {
            contentOut = first.message.content;
            if (contentOut) {
                contentOut += `\n\n---\n*Disclaimer: AI dapat melakukan kesalahan. Selalu verifikasi jawaban dengan buku teks atau guru Anda.*`;
            }
        }
    }

    if (!contentOut.trim()) {
        if (imageDataUrl) {
            contentOut = '### Gambar Tidak Dapat Dianalisis\n\nMaaf, saya kesulitan membaca soal atau materi pada gambar ini.\n\n**Saran:**\n- Pastikan tulisan tangan terbaca jelas\n- Pastikan pencahayaan cukup';
        } else {
            contentOut = '### Informasi Kurang Lengkap\n\nMaaf, saya butuh detail lebih lanjut untuk membantu Anda belajar.\n\n**Mohon berikan:**\n- Topik pelajaran spesifik\n- Detail pertanyaan atau soal';
        }
    }

    return contentOut;
}

// Helper functions (Tetap dipertahankan agar tidak error saat import)
export function validatePlantImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!validTypes.includes(file.type)) throw new Error('Format gambar harus JPG, PNG, atau WebP');
    if (file.size > maxSize) throw new Error('Ukuran gambar maksimal 10MB');
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
