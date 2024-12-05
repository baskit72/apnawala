import React, { useState, useMemo } from 'react';

import axios from 'axios'; // Ensure axios is installed: npm install axios

//import '../style/VideoWidget.css';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles


const VideoWidget = ({ content = {}, onUpdate = () => {}, canvasMode, onSave }) => {


  const [isEditing, setIsEditing] = useState(false);

  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [widgetContent, setWidgetContent] = useState(content.content || '');
  const [linkUrl, setLinkUrl] = useState(content.linkUrl ||'');
  const [clickAction, setClickAction] = useState(content.clickAction ||'none');
  const [videoFile, setVideoFile] = useState(content.videoFile || null); // For storing the uploaded video file
  const [videoSource, setVideoSource] = useState(content.videoSource || 'YouTube');
  const [videoURL, setVideoURL] = useState(content.videoURL || null);
  const [alignment, setAlignment] = useState(content.alignment || 'center');
  const [aspectRatio, setAspectRatio] = useState(content.aspectRatio || '16:9');
  const [autoplay, setAutoplay] = useState(content.autoplay || false);
  const [mute, setMute] = useState(content.mute || false);
  const [loop, setLoop] = useState(content.loop || false);
  const [controls, setControls] = useState(content.controls || true);
  const [privacyMode, setPrivacyMode] = useState(content.privacyMode || false);
  const [cssFilter, setCssFilter] = useState(content.cssFilter || 'none');
  const [margin, setMargin] = useState(content.margin || { top: 0, right: 0, bottom: 0, left: 0 });
  const [padding, setPadding] = useState(content.padding || { top: 0, right: 0, bottom: 0, left: 0 });



  // Style and Advanced Tabs
  const [resolution, setResolution] = useState(content.resolution ||'Full');
  const [opacity, setOpacity] = useState(content.opacity ||1);
  const [borderRadius, setBorderRadius] = useState(content.borderRadius || '0px');
  const [width, setWidth] = useState(content.width ||'100%');
  const [height, setHeight] = useState(content.height || 'auto'); // New state for custom height
  const [alignSelf, setAlignSelf] = useState(content.alignSelf ||'center');
  const [position, setPosition] = useState(content.position ||'default');
  const [boxBoxShadow, setBoxBoxShadow] = useState( content.boxBoxShadow ||'none');
  const [imageBoxShadow, setImageBoxShadow] = useState( content.imageBoxShadow ||'none');




  const handleContentChange = (newContent) => {
      setWidgetContent(newContent);
      onUpdate({ ...content, content: newContent }); // Notify parent
    };



  // UseEffect to create and clean up URL object

  const handleFileUpload = async (file) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Replace the URL below with your actual backend API endpoint
      const response = await axios.post('http://localhost:8080/api/video/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.url) {
        setVideoURL(response.data.url);
        setVideoSource('Any URL'); // Switch to Any URL after successful upload
      } else {
        console.error('Upload failed: No public URL returned.');
      }
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResolutionChange = (e) => {
    setResolution(e.target.value);
    if (e.target.value !== 'Custom') {
      setWidth('auto');
      setHeight('auto'); // Reset height when not custom
    }
  };
// Map resolution options to width and height values
  const resolutionDimensions = {
    Thumbnail: { width: '150px', height: '150px' },
    Medium: { width: '300px', height: '300px' },
    Large: { width: '600px', height: '600px' },
    Full: { width: '100%', height: 'auto' },
    Custom: { width: width || 'auto', height: height || 'auto' }, // Custom allows user-defined width and height
  };


  const handleSave = () => {
    const widgetData = {
      content: widgetContent,
      linkUrl,
      clickAction,
      videoFile, // Store the uploaded video file
      videoSource,
      videoURL,
      alignment,
      aspectRatio,
      autoplay,
      mute,
      loop,
      controls,
      privacyMode,
      cssFilter,
      margin,
      padding,
      resolution,
      opacity,
      borderRadius,
      width,
      height, // Save custom height
      alignSelf,
      position,
      boxBoxShadow,
      imageBoxShadow
    };

    // Call the parent onSave function with widgetData
    onSave(widgetData);
  };



const widgetStyle = useMemo(() => ({
    resolution,  // Use the selected resolution for the video size
    opacity,
    filter: cssFilter,  // Use CSS filter for the video
    cursor: clickAction === 'link' ? 'pointer' : 'default',  // Change cursor to pointer if clickAction is set to link
    textAlign: alignment,
    borderRadius: `${borderRadius}`,
    overflow: borderRadius ? 'hidden' : 'visible',
    margin: `${margin?.top || 0}px ${margin?.right || 0}px ${margin?.bottom || 0}px ${margin?.left || 0}px`,
    padding: `${padding?.top || 0}px ${padding?.right || 0}px ${padding?.bottom || 0}px ${padding?.left || 0}px`,
    width,
    height, // Apply height from state
    alignSelf,
    boxShadow: `${boxBoxShadow}`, // Apply box shadow
    position: position === 'default' ? 'static' : position,
    transition: '0.3s ease-in-out',  // Smooth transition for style changes
  }), [
    resolution,
    opacity,
    cssFilter,
    clickAction,
    alignment,
    borderRadius,
    margin,
    padding,
    width,
    height,
    alignSelf,
    boxBoxShadow,
    position,
  ]);



  const getVideoEmbedURL = () => {
    if (videoSource === 'YouTube') {
      const videoId = extractYouTubeID(videoURL);
      if (videoId) {
                  return `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (videoSource === 'Vimeo') {
      return `https://player.vimeo.com/video/${videoURL}`;
    }
    return videoURL; // for local file or direct URL
  };

  const extractYouTubeID = (url) => {
          const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
          const match = url.match(regex);
          return match ? match[1] : null;
      };

  return (
    <div
      className="video-widget"
      style={widgetStyle}
    >
      {(videoURL || videoFile) ? (
       <>
        <div
          className="video-container"
          style={{
            ...resolutionDimensions[resolution],
            width: '100%',
            height: '0',
            paddingBottom: aspectRatio === '16:9' ? '56.25%' : aspectRatio === '4:3' ? '75%' : '100%',
            position: 'relative',
            overflow: 'hidden',
            marginLeft: alignment === 'center' ? 'auto' : '0',
            marginRight: alignment === 'center' ? 'auto' : '0',
            boxShadow: `${imageBoxShadow}`,
            filter: cssFilter,

          }}

          onClick={() => {
                      if (clickAction === 'popup') {
                        alert('Video clicked!');
                      } else if (clickAction === 'link' && linkUrl) {
                        window.open(linkUrl, '_blank');
                      }
                    }}

        >
        {videoFile ? (
                     <video
                       src={URL.createObjectURL(videoFile)}
                       autoPlay={autoplay}
                       muted={mute}
                       loop={loop}
                       controls={controls}
                       style={{
                       ...resolutionDimensions[resolution],
                         position: 'absolute',
                         top: '0',
                         left: '0',
                         width: '100%',
                         height: '100%',
                         borderRadius: borderRadius,
                         boxShadow: `${imageBoxShadow}`,
                         opacity: opacity,
                       }}
                     ></video>
                   ) : (
          <iframe
            src={`${getVideoEmbedURL()}?autoplay=${autoplay ? 1 : 0} & muted=${mute ? 1 : 0} & loop=${loop ? 1 : 0} & controls=${controls ? 1 : 0} & modestbranding=${privacyMode ? 1 : 0}`}
            title="Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              ...resolutionDimensions[resolution],
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              borderRadius: borderRadius,
              boxShadow: `${imageBoxShadow}`,
              opacity: opacity,
            }}
          ></iframe>
          )}


        </div>
        <div dangerouslySetInnerHTML={{ __html: widgetContent }}></div>
        </>
      ): (
               <p>No Video selected</p>
      )}




      {/* Edit Image Button: Toggles All Tabs */}
            {canvasMode === 'edit' && (
              <button
                onClick={() => {
                  if (isEditing) handleSave(); // Save when exiting edit mode
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? 'Close Edit' : 'Edit Video'}
              </button>
            )}




      {/* Additional style and layout options general  */}
      { isEditing && (
        <div>
        <h4 onClick={() => setIsGeneralOpen(!isGeneralOpen)}>Content</h4>
                  {isGeneralOpen && (
      <div className="style-options">
        <div className="video-controls">
                <select value={videoSource} onChange={(e) => setVideoSource(e.target.value)}>
                  <option value="YouTube">YouTube</option>
                  <option value="Vimeo">Vimeo</option>
                  <option value="Local">Local File</option>
                  <option value="Any URL">Any URL</option>
                </select>

                {videoSource === 'Local' ? (
                                  <div>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setVideoFile(e.target.files[0])}
                                  />

                                  <button
                                                  onClick={() => {
                                                    if (videoFile) handleFileUpload(videoFile);
                                                  }}
                                                  disabled={!videoFile || isUploading}
                                                >
                                                  {isUploading ? 'Uploading...' : 'Upload'}
                                                </button>
                                  </div>


                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Video URL or ID"
                                    value={videoURL}
                                    onChange={(e) => setVideoURL(e.target.value)}
                                  />
                                )}

              </div>

        <label>
          Aspect Ratio:
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
          </select>
        </label>
        <label>CSS Filter</label>
                        <select onChange={(e) => setCssFilter(e.target.value)} value={cssFilter}>
                            <option value="none">None</option>
                            <option value="grayscale(100%)">Grayscale</option>
                            <option value="sepia(100%)">Sepia</option>
                            <option value="blur(5px)">Blur</option>
                            <option value="contrast(200%)">High Contrast</option>
                        </select>



          <label>Click Action:</label>
          <select value={clickAction} onChange={(e) => setClickAction(e.target.value)}>
            <option value="none">None</option>
            <option value="link">Link</option>
            <option value="popup">Popup</option>
          </select>

          {clickAction === 'link' && (
            <div>
              <label>Enter URL:</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}



        <label>
          Autoplay:
          <input type="checkbox" checked={autoplay} onChange={() => setAutoplay(!autoplay)} />
        </label>
        <label>
          Mute:
          <input type="checkbox" checked={mute} onChange={() => setMute(!mute)} />
        </label>
        <label>
          Loop:
          <input type="checkbox" checked={loop} onChange={() => setLoop(!loop)} />
        </label>
        <label>
          Player Controls:
          <input type="checkbox" checked={controls} onChange={() => setControls(!controls)} />
        </label>
        <label>
          Privacy Mode:
          <input type="checkbox" checked={privacyMode} onChange={() => setPrivacyMode(!privacyMode)} />
        </label>
      </div>

      )}


      {isEditing && (
         <div>
         <h4 onClick={() => setIsStyleOpen(!isStyleOpen)}>Style</h4>
        {isStyleOpen && (
           <div>

           <label>Alignment: </label>
                     <select value={alignment} onChange={(e) => setAlignment(e.target.value)}>
                       <option value="left">Left</option>
                       <option value="center">Center</option>
                       <option value="right">Right</option>
                     </select>

           <label>Image Resolution:</label>
                                   <select value={resolution} onChange={handleResolutionChange}>
                                     <option value="Thumbnail">Thumbnail</option>
                                     <option value="Medium">Medium</option>
                                     <option value="Large">Large</option>
                                     <option value="Full">Full</option>
                                     <option value="Custom">Custom</option>
                                   </select>
                                   {resolution === 'Custom' && (
                                                             <div className="custom-resolution-inputs">
                                                               <label>
                                                                 Width:
                                                                 <input
                                                                   type="text"
                                                                   value={width}
                                                                   onChange={(e) => setWidth(e.target.value)}
                                                                   placeholder="e.g., 400px or 50%"
                                                                 />
                                                               </label>
                                                               <label>
                                                                 Height:
                                                                 <input
                                                                   type="text"
                                                                   value={height}
                                                                   onChange={(e) => setHeight(e.target.value)}
                                                                   placeholder="e.g., choose auto 300px or auto"
                                                                 />
                                                               </label>
                                                             </div>
                                                           )}



           <label>Border Radius</label>
                           <input
                               type="text"
                               placeholder="e.g., 10px"
                               value={borderRadius}
                               onChange={(e) => setBorderRadius(e.target.value)}
                           />


           <label>Opacity: </label>
                                   <input
                                     type="range"
                                     min="0"
                                     max="1"
                                     step="0.1"
                                     value={opacity}
                                     onChange={(e) => setOpacity(e.target.value)}
                                   />








           </div>
        )}


         </div>

         )}

         {/* Advanced Tab */}
               {isEditing && (
                 <div>
                   <h4 onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>Advanced</h4>
                   {isAdvancedOpen && (
                   <div>
                   <label>Margin:</label>
                   <input type="number" value={margin.top} onChange={(e) => setMargin({ ...margin, top: e.target.value })} placeholder="Top" />
                   <input type="number" value={margin.right} onChange={(e) => setMargin({ ...margin, right: e.target.value })} placeholder="Right" />
                   <input type="number" value={margin.bottom} onChange={(e) => setMargin({ ...margin, bottom: e.target.value })} placeholder="Bottom" />
                   <input type="number" value={margin.left} onChange={(e) => setMargin({ ...margin, left: e.target.value })} placeholder="Left" />

                   <label>Padding:</label>
                   <input type="number" value={padding.top} onChange={(e) => setPadding({ ...padding, top: e.target.value })} placeholder="Top" />
                   <input type="number" value={padding.right} onChange={(e) => setPadding({ ...padding, right: e.target.value })} placeholder="Right" />
                   <input type="number" value={padding.bottom} onChange={(e) => setPadding({ ...padding, bottom: e.target.value })} placeholder="Bottom" />
                   <input type="number" value={padding.left} onChange={(e) => setPadding({ ...padding, left: e.target.value })} placeholder="Left" />

                   {/*<label>Width:</label>
                   <input type="text" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 100% 0r 100px or auto"/>

                   <label>Height:</label>
                   <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 100% 0r 100px or auto"/> {/* Added height input */}


                   <label>Align Self:</label>
                   <select value={alignSelf} onChange={(e) => setAlignSelf(e.target.value)}>
                     <option value="left">Left</option>
                     <option value="center">Center</option>
                     <option value="right">Right</option>
                     <option value="stretch">Stretch</option>
                   </select>


                   <label>Position:</label>
                   <select value={position} onChange={(e) => setPosition(e.target.value)}>
                     <option value="default">Default</option>
                     <option value="absolute">Absolute</option>
                     <option value="relative">Relative</option>
                   </select>

                   <label>Box Shadow: </label>
                             <input
                               type="text"
                               value={boxBoxShadow}
                               onChange={(e) => setBoxBoxShadow(e.target.value)}
                               placeholder="e.g., 2px 2px 5px #888888"
                             />

                   <label>Image Box Shadow:</label>
                                       <input
                                         type="text"
                                         value={imageBoxShadow}
                                         onChange={(e) => setImageBoxShadow(e.target.value)}
                                         placeholder="e.g., 2px 2px 5px #888888"
                                       />


                    <ReactQuill
                                          value={widgetContent}
                                          onChange={handleContentChange}
                                          modules={VideoWidget.modules}
                                          formats={VideoWidget.formats}
                                          placeholder="Write your caption here..."
                                          />


                   </div>
                   )}
                 </div>

               )}

    </div>
    )}
    </div>
  );
};



VideoWidget.modules = {
  toolbar: [
    [{ header: [1, 2, 3,4,5,6,false] }],
    [{ font: [] }], // Font family
    [{ size: [] }], // Font size
    ['bold', 'italic', 'underline', 'strike'],
    [{ script: "sub" }, { script: "super" }],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet'}  , { list: 'check' } ],
    [{ list: 'custom-bullet', attributes: { 'list-style-type': ['disc', 'circle', 'square'] } }], // Custom bullet styles
    [{ align: [] }], // Alignment
    [{ indent: '-1' }, { indent: '+1' }], // Indentation
    ['blockquote', 'code-block'], // Blockquote and code block
    ['link', 'image'],
    ['clean'],
  ],
};

VideoWidget.formats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', "strike", "script",
  'color', 'background', 'list', 'bullet', 'check', 'custom-bullet', 'align', 'indent',
  'blockquote', 'code-block', 'link', 'image',
];



export default VideoWidget;
