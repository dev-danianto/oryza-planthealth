export async function chatEdutora({
    prompt,
    imageDataUrl,
    model,
    signal
}) {
    const baseURL =
        import.meta.env.VITE_OPENROUTER_BASE_URL; [span_0](start_span)//[span_0](end_span)
    const apiKey =
        import.meta.env.VITE_OPENROUTER_API_KEY; [span_1](start_span)//[span_1](end_span)
    const referer =
        import.meta.env.VITE_APP_REFERER || window.location.href; [span_2](start_span)//[span_2](end_span)
    const title =
        import.meta.env.VITE_APP_TITLE || 'EDUTORA AI Learning Assistant'; [span_3](start_span)//[span_3](end_span)
    const chosenModel = model ||
        import.meta.env.VITE_OPENROUTER_MODEL; [span_4](start_span)//[span_4](end_span)

    if (!apiKey) {
        throw new Error('Missing VITE_OPENROUTER_API_KEY environment variable'); [span_5](start_span)//[span_5](end_span)
    }

    // ✅ SISTEM PROMPT UNTUK EDUTORA - AI PELAJAR
    const systemPrompt = `Anda adalah EDUTORA, AI Asisten Belajar Pintar yang didesain untuk membantu pelajar SD, SMP, SMA, hingga Mahasiswa memahami materi pelajaran.

KEAHLIAN UTAMA:
- Matematika & Sains (Fisika, Kimia, Biologi)
- Coding & Algoritma
- Sejarah & Ilmu Sosial
- Bahasa & Sastra
- Analisis Soal & Tugas

GAYA MENGAJAR:
- **Jangan hanya memberi kunci jawaban!** Jelaskan *bagaimana* cara mendapatkan jawaban tersebut (Step-by-step).
- Gunakan bahasa yang suportif, sabar, dan mudah dimengerti (ELI5 - Explain Like I'm 5 jika materi sulit).
- Gunakan analogi kehidupan nyata untuk menjelaskan konsep abstrak.
- Dorong *Critical Thinking* siswa.

FORMAT JAWABAN (UNTUK SOAL/TUGAS):
1. 🎯 **ANALISIS SOAL**: Identifikasi apa yang diketahui dan apa yang ditanyakan.
2. 💡 **KONSEP KUNCI**: Sebutkan rumus, teori, atau dalil yang digunakan.
3. 📝 **LANGKAH PENYELESAIAN**: Uraikan perhitungan atau logika secara runtut.
4. ✅ **KESIMPULAN**: Jawaban akhir yang jelas.
5. 📚 **TIPS BELAJAR**: Tips singkat untuk mengingat materi ini.

ATURAN FORMATTING:
- Gunakan format LaTeX untuk rumus matematika jika memungkinkan (gunakan $ untuk inline, $$ untuk blok).
- Gunakan **bold** untuk istilah penting.
- Gunakan list angka (1. 2. 3.) untuk langkah-langkah.
- Gunakan ### untuk memisahkan bagian jawaban.

Tujuan utama Anda adalah membuat siswa MENGERTI, bukan sekadar menyalin jawaban.`;

    // Enhanced prompt untuk konteks pendidikan
    const enhancedPrompt = imageDataUrl ?
        `${prompt ? prompt + '\n\n' : ''}Tolong analisis gambar materi/soal ini dan bantu saya memecahkannya.
        
        INSTRUKSI KHUSUS BERDASARKAN JENIS GAMBAR:
        
        JIKA INI SOAL MATEMATIKA/SAINS:
        - Ekstrak teks/angka dari gambar.
        - Identifikasi variabel yang diketahui.
        - Selesaikan dengan langkah terstruktur.
        
        JIKA INI DIAGRAM/PETA:
        - Jelaskan komponen-komponen visualnya.
        - Hubungkan dengan materi pelajaran terkait.
        
        JIKA INI TEKS BACAAN/CATATAN:
        - Buat ringkasan poin-poin kunci.
        - Jelaskan istilah sulit yang ada di dalamnya.
        
        Pastikan penjelasanmu akurat dan mendidik.` :
        `PERTANYAAN/MATERI: ${prompt}
        
        Bantu saya mempelajari topik ini. Berikan penjelasan yang komprehensif, terstruktur, dan mudah dipahami sesuai format tutor Edutora.`;

    const content = [{
        type: 'text',
        [span_6](start_span)text: enhancedPrompt //[span_6](end_span)
    }];

    if (imageDataUrl) {
        content.push({
            [span_7](start_span)type: 'image_url', //[span_7](end_span)
            image_url: {
                url: imageDataUrl,
                [span_8](start_span)detail: 'high' //[span_8](end_span)
            }
        });
    }

    const body = {
        [span_9](start_span)model: chosenModel, //[span_9](end_span)
        messages: [{
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content
            }
        ],
        temperature: 0.3, // Sedikit dinaikkan agar penjelasan lebih luwes tapi tetap akurat
        max_tokens: 2500, // Token lebih banyak untuk penjelasan panjang
        top_p: 0.9
    };

    const res = await fetch(baseURL + '/chat/completions', {
        [span_10](start_span)method: 'POST', //[span_10](end_span)
        headers: {
            [span_11](start_span)'Authorization': 'Bearer ' + apiKey, //[span_11](end_span)
            [span_12](start_span)'HTTP-Referer': referer, //[span_12](end_span)
            [span_13](start_span)'X-Title': title, //[span_13](end_span)
            [span_14](start_span)'Content-Type': 'application/json' //[span_14](end_span)
        },
        [span_15](start_span)body: JSON.stringify(body), //[span_15](end_span)
        [span_16](start_span)signal //[span_16](end_span)
    });

    if (!res.ok) {
        const errText = await res.text(); [span_17](start_span)//[span_17](end_span)
        if (res.status === 429) {
            throw new Error('Terlalu banyak permintaan. Istirahat sejenak dan coba lagi.'); [span_18](start_span)//[span_18](end_span)
        } else if (res.status === 401) {
            throw new Error('API key tidak valid. Periksa konfigurasi Edutora.'); [span_19](start_span)//[span_19](end_span)
        } else if (res.status === 400) {
            throw new Error('Format permintaan tidak valid. Coba gambar yang lebih jelas.'); [span_20](start_span)//[span_20](end_span)
        } else {
            throw new Error(`Error ${res.status}: ${errText || 'Gagal menghubungi tutor AI'}`); [span_21](start_span)//[span_21](end_span)
        }
    }

    const json = await res.json(); [span_22](start_span)//[span_22](end_span)
    let contentOut = '';

    if (json && json.choices && Array.isArray(json.choices)) {
        const first = json.choices[0];
        if (first && first.message && typeof first.message.content === 'string') {
            contentOut = first.message.content; [span_23](start_span)//[span_23](end_span)

            // ✅ POST-PROCESSING untuk disclaimer pendidikan
            if (contentOut) {
                contentOut += `\n\n---\n*Disclaimer: AI dapat melakukan kesalahan. Selalu verifikasi jawaban dengan buku teks atau guru Anda.*`;
            }
        }
    }

    // ✅ FALLBACK
    if (!contentOut.trim()) {
        if (imageDataUrl) {
            contentOut = '### Gambar Tidak Dapat Dianalisis\n\nMaaf, saya kesulitan membaca soal atau materi pada gambar ini.\n\n**Saran:**\n- Pastikan tulisan tangan terbaca jelas\n- Pastikan pencahayaan cukup\n- Coba ketik ulang soalnya secara manual'; [span_24](start_span)//[span_24](end_span)
        } else {
            contentOut = '### Informasi Kurang Lengkap\n\nMaaf, saya butuh detail lebih lanjut untuk membantu Anda belajar.\n\n**Mohon berikan:**\n- Topik pelajaran spesifik\n- Detail pertanyaan atau soal\n- Konteks materi yang ingin dipahami'; [span_25](start_span)//[span_25](end_span)
        }
    }

    return contentOut; [span_26](start_span)//[span_26](end_span)
}

// Helper functions tetap sama (Validasi & Resize Image berguna untuk upload soal)
export function validatePlantImage(file) { // Bisa direname jadi validateImage saja, tapi dibiarkan agar kompatibel
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']; [span_27](start_span)//[span_27](end_span)
    const maxSize = 10 * 1024 * 1024; [span_28](start_span)// 10MB[span_28](end_span)

    if (!validTypes.includes(file.type)) {
        throw new Error('Format gambar harus JPG, PNG, atau WebP'); [span_29](start_span)//[span_29](end_span)
    }

    if (file.size > maxSize) {
        throw new Error('Ukuran gambar maksimal 10MB'); [span_30](start_span)//[span_30](end_span)
    }

    return true; [span_31](start_span)//[span_31](end_span)
}

export function resizeImage(file, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve) => {
        [span_32](start_span)const canvas = document.createElement('canvas'); //[span_32](end_span)
        const ctx = canvas.getContext('2d'); [span_33](start_span)//[span_33](end_span)
        const img = new Image(); [span_34](start_span)//[span_34](end_span)

        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height); [span_35](start_span)//[span_35](end_span)
            canvas.width = img.width * ratio; [span_36](start_span)//[span_36](end_span)
            canvas.height = img.height * ratio; [span_37](start_span)//[span_37](end_span)

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); [span_38](start_span)//[span_38](end_span)

            canvas.toBlob(resolve, 'image/jpeg', quality); [span_39](start_span)//[span_39](end_span)
        };

        img.src = URL.createObjectURL(file); [span_40](start_span)//[span_40](end_span)
    });
}
