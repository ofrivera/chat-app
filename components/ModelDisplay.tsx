'use client';

import { useEffect, useState } from 'react';

export function ModelDisplay() {
    const [model, setModel] = useState<string>('');

    useEffect(() => {
        async function fetchModel() {
            const response = await fetch('/api/model');
            const data = await response.json();
            setModel(data.model);
        }
        fetchModel();
    }, []);

    return (
        <div className="text-sm font-medium text-gray-400">
            Model: {model}
        </div>
    );
}