import React, { useState } from 'react';
import axios from 'axios';

function VideoWidget({ onSave }) {
    const [sourceType, setSourceType] = useState(''); // youtube, url, local
    const [videoUrl, setVideoUrl] = useState('');
    const [file, setFile] = useState(null);
    const [autoplay, setAutoplay] = useState(false);
    const [mute, setMute] = useState(false);
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        grayscale: 0,
    });

    // Handle source type change
    const handleSourceChange = (e) => {
        setSourceType(e.target.value);
        setVideoUrl('');  // Reset video URL when source changes
        setFile(null);    // Clear file input for fresh selection
    };

    // Handle file selection for local video
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Upload file and get URL
    const handleFileUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8080/api/video/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Login successful!", response.data.url);
            setVideoUrl(response.data.url); // Set returned URL as video source
        } catch (error) {
            console.error("Upload error:", error);
        }
    };

    // Save widget configuration
    const handleSave = () => {
        const widgetData = {
            sourceType,
            videoUrl,
            autoplay,
            mute,
            filters,
        };
        onSave(widgetData); // Send data to parent component or backend
    };

    return (
        <div>
            <h3>Video Widget</h3>

            {/* Source Selection */}
            <label>Video Source:</label>
            <select value={sourceType} onChange={handleSourceChange}>
                <option value="">Select Source</option>
                <option value="youtube">YouTube</option>
                <option value="url">URL</option>
                <option value="local">Local File</option>
            </select>

            {/* URL Input for YouTube or external URLs */}
            {sourceType === 'youtube' || sourceType === 'url' ? (
                <input
                    type="text"
                    placeholder="Enter video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                />
            ) : null}

            {/* File Upload for Local File */}
            {sourceType === 'local' ? (
                <div>
                    <input type="file" onChange={handleFileChange} />
                    <button onClick={handleFileUpload}>Upload</button>
                </div>
            ) : null}

            {/* Video Controls */}
            <label>
                <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => setAutoplay(e.target.checked)}
                />
                Autoplay
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={mute}
                    onChange={(e) => setMute(e.target.checked)}
                />
                Mute
            </label>

            {/* CSS Filters */}
            <label>Brightness:</label>
            <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) =>
                    setFilters({ ...filters, brightness: e.target.value })
                }
            />

            <label>Contrast:</label>
            <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) =>
                    setFilters({ ...filters, contrast: e.target.value })
                }
            />

            <label>Grayscale:</label>
            <input
                type="range"
                min="0"
                max="100"
                value={filters.grayscale}
                onChange={(e) =>
                    setFilters({ ...filters, grayscale: e.target.value })
                }
            />

            <button onClick={handleSave}>Save</button>
        </div>
    );
}

export default VideoWidget;
