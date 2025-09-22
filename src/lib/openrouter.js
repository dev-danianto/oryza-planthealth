export async function analyzeImage({
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
        import.meta.env.VITE_APP_REFERER || window.location.origin;
    const title =
        import.meta.env.VITE_APP_TITLE || 'OpenRouter AI PWA';
    const chosenModel = model ||
        import.meta.env.VITE_OPENROUTER_MODEL;

    if (!apiKey) {
        throw new Error('Missing VITE_OPENROUTER_API_KEY environment variable');
    }

    const body = {
        model: chosenModel,
        messages: [{
            role: 'user',
            content: [{
                    type: 'text',
                    text: prompt || 'Analyze this image'
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageDataUrl
                    }
                }
            ]
        }]
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
        throw new Error('OpenRouter error ' + res.status + ': ' + errText);
    }

    const json = await res.json();
    let content = '';
    if (json && json.choices && Array.isArray(json.choices)) {
        const first = json.choices[0];
        if (first && first.message && typeof first.message.content === 'string') {
            content = first.message.content;
        }
    }
    return content;
}