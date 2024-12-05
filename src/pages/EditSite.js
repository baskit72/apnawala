import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDrop, useDrag } from 'react-dnd';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import TextWidget from '../widgets/TextWidget';
import ImageWidget from '../widgets/ImageWidget';
import VideoWidget from '../widgets/VideoWidget';
import ProductGrid from '../widgets/ProductGrid';
import '../style/EditSite.css';

const widgetOptions = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'productGrid', label: 'Product Grid' },
];

const DraggableWidget = ({ widget }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: { type: widget.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="widget-option"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {widget.label}
    </div>
  );
};

const EditSite = () => {
  const { id } = useParams();
  const [widgets, setWidgets] = useState([]);
  const [canvasMode, setCanvasMode] = useState('view'); // 'edit' or 'view'
  const [selectedWidgetId, setSelectedWidgetId] = useState(null); // Track selected widget for editing
  const [deletedWidgetIds, setDeletedWidgetIds] = useState([]); // Track deleted widgets

  const fetchWidgets = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/widgets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch widgets');
      const data = await response.json();
      console.log('Fetched Widgets:', data); // Check fetched data structure
      setWidgets(data.map(widget => ({
            ...widget,
            properties: widget.properties || {} // Ensure properties are initialized
          })));
    } catch (error) {
      console.error('Error fetching widgets:', error);
      alert('Failed to load widgets. Please try again later.');
    }
  }, [id]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const [{ isOver }, drop] = useDrop({
    accept: 'WIDGET',
    drop: (item) => {
      setWidgets((prev) => [
        ...prev,
        {
          ...item,
          id: Date.now(),
          mode: 'view',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          properties: item.properties || {}, // Initialize with empty properties
        },
      ]);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const handleSave = async () => {

     const confirmSave = window.confirm("Are you sure you want to save changes?");
     if (!confirmSave) return; // Abort if user cancels

    const token = localStorage.getItem('token');
    const canvasWidgets = widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        mode: widget.mode,
        x: widget.x,
        y: widget.y,
        width: widget.width,
        height: widget.height,
        properties: widget.properties  // Include all styling and content here
      }));

    try {
      const response = await fetch(`http://localhost:8080/widgets/save/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ canvasWidgets, deletedWidgetIds }),
      });

      if (!response.ok) throw new Error('Failed to save website');
      alert('Website saved successfully!');
    } catch (error) {
      console.error('Error saving website:', error);
      alert('Failed to save the website. Please try again later.');
    }
  };


  const canToggleCanvasMode = widgets.every((widget) => widget.mode === 'view');

  //const canToggleCanvasMode = widgets.every((widget) => widget.mode === 'view' && widget.x >= 0 && widget.y >= 0);


  const handleCanvasModeToggle = () => {
    if (canvasMode === 'edit' && canToggleCanvasMode) {
      setCanvasMode('view');
    } else {
      setCanvasMode('edit');
    }
  };

  const handleWidgetClick = (id) => {
    setSelectedWidgetId(id); // Set the selected widget for editing
  };

  // Update a widget's properties
  const updateWidgetProperties = (id, newProperties) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id ? { ...widget, properties: newProperties } : widget
      )
    );
  };

  const handleRemoveWidget = (id) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id)); // Remove widget by id
    setDeletedWidgetIds((prev) => [...prev, id]); // Track deleted widget ID
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null); // Deselect if the removed widget was selected
    }
  };

  return (
    <div className="edit-site-container">
      <h1>Website Builder</h1>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleCanvasModeToggle} disabled={canvasMode === 'edit' && !canToggleCanvasMode}>
        ({canvasMode === 'edit' ? 'View' : 'Edit'})
      </button>

      <div className="widget-list">
        <h2>Available Widgets</h2>
        {widgetOptions.map((widget) => (
          <DraggableWidget key={widget.type} widget={widget} />
        ))}
      </div>

      <div ref={drop} className={`canvas ${isOver ? 'hover' : ''}`}>
        {widgets.map((widget) => (
          <Draggable
            key={widget.id}
            disabled={canvasMode !== 'view'}
            defaultPosition={{ x: widget.x, y: widget.y }}
            onStop={(e, data) =>
              setWidgets((prev) =>
                prev.map((w) =>
                  w.id === widget.id ? { ...w, x: data.x, y: data.y } : w
                )
              )
            }
          >
            <ResizableBox
              width={widget.width}
              height={widget.height}
              resizeHandles={canvasMode === 'view'? []:['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']}
              onResizeStop={(e, data) =>
                setWidgets((prev) =>
                  prev.map((w) =>
                    w.id === widget.id
                      ? { ...w, width: data.size.width, height: data.size.height }
                      : w
                  )
                )
              }
              minConstraints={[10, 10]}
              maxConstraints={[1000, 1000]}
              className={`canvas-widget ${widget.mode} ${widget.id === selectedWidgetId ? 'selected' : ''}`}
              onClick={() => handleWidgetClick(widget.id)} // Set selected widget on click
              style={{
                zIndex: widget.id === selectedWidgetId ? 10 : 1, // Bring selected widget to front
              }}
            >
              {widget.type === 'text' && (
                <TextWidget
                          content={{
                                      content: widget.properties.content || '',
                                      bgImage: widget.properties.bgImage || '',
                                      isTransparent: widget.properties.isTransparent,
                                      gradient: widget.properties.gradient || '',
                                      bgSize: widget.properties.bgSize || 'cover',
                                      bgColor:widget.properties.bgColor || '#ffffff',
                                      // Add other properties you want to pass
                                      textType: widget.properties.textType || 'paragraph',
                                      alignment: widget.properties.alignment || 'left',
                                      blurLevel: widget.properties.blurLevel || 0,
                                      boxShadow: widget.properties.boxShadow || 'none',
                                      marginTop: widget.properties.marginTop || '10px',
                                      marginLeft: widget.properties.marginLeft || '10px',
                                      paddingTop: widget.properties.paddingTop || '20px',
                                      marginRight: widget.properties.marginRight || '10px',
                                      paddingLeft: widget.properties.paddingLeft || '20px',
                                      borderRadius: widget.properties.borderRadius || '5px',
                                      marginBottom: widget.properties.marginBottom || '10px',
                                      paddingRight: widget.properties.paddingRight || '20px',
                                      paddingBottom: widget.properties.paddingBottom || '20px',
                                      backgroundImageBlur: widget.properties.backgroundImageBlur || 0,
                                    }}
                          onSave={(newProperties) =>
                            updateWidgetProperties(widget.id, newProperties)
                          }
                        />
              )}
              {
                widget.type === 'image' &&
                (
                  <ImageWidget widgetData
                    content={{
                      content: widget.properties.content || '',
                      image: widget.properties.image || '',
                      resolution: widget.properties.resolution || 'cover', // Default to 'cover' if no resolution is provided
                      clickAction: widget.properties.clickAction || 'none', // Default action if not specified
                      linkUrl: widget.properties.linkUrl || '',
                      alignment: widget.properties.alignment || 'left',
                      imageBorderRadius: widget.properties.imageBorderRadius || '0px',
                      boxBorderRadius: widget.properties.boxBorderRadius || '0px',
                      bgColor:widget.properties.bgColor || '#ffffff',
                      isTransparent: widget.properties.isTransparent,
                      margin: {
                        top: widget.properties.margin?.top || '10px',
                        right: widget.properties.margin?.right || '10px',
                        bottom: widget.properties.margin?.bottom || '10px',
                        left: widget.properties.margin?.left || '10px',
                      },
                      padding: {
                        top: widget.properties.padding?.top || '10px',
                        right: widget.properties.padding?.right || '10px',
                        bottom: widget.properties.padding?.bottom || '10px',
                        left: widget.properties.padding?.left || '10px',
                      },
                      width: widget.properties.width || 'auto',
                      height: widget.properties.height || 'auto',
                      alignSelf: widget.properties.alignSelf || 'auto',
                      order: widget.properties.order || 0,
                      boxBoxShadow: widget.properties.boxBoxShadow || 'none',
                      imageBoxShadow: widget.properties.imageBoxShadow || 'none',
                      opacity: widget.properties.opacity || 'none',
                      filter: widget.properties.filter || 'none',

                      position: widget.properties.position || 'static',
                    }}



                   canvasMode={canvasMode}

                   onSave={(newProperties) =>
                                               updateWidgetProperties(widget.id, newProperties)
                          }
                   />
                )
              }
              {widget.type === 'video' && <VideoWidget
                           widgetData
                                          content={{
                                                   content: widget.properties.content || '',
                                                   linkUrl: widget.properties.linkUrl || '',
                                                   clickAction: widget.properties.clickAction || '',
                                                   videoFile:  widget.properties.videoFile || '',
                                                   videoSource: widget.properties.videoSource || '',
                                                   videoURL: widget.properties.videoURL || '',
                                                   alignment: widget.properties.alignment || '',
                                                   aspectRatio: widget.properties.aspectRatio || '',
                                                   autoplay: widget.properties.autoplay || '',
                                                   mute:  widget.properties.mute || '',
                                                   loop: widget.properties.loop || '',
                                                   controls: widget.properties.controls || '',
                                                   privacyMode: widget.properties.privacyMode || '',
                                                   cssFilter: widget.properties.cssFilter || '',
                                                   margin    : widget.properties.margin || '',
                                                   padding : widget.properties.padding || '',
                                                   resolution : widget.properties.resolution || '',
                                                   opacity : widget.properties.opacity || '',
                                                   borderRadius : widget.properties.borderRadius || '',
                                                   width : widget.properties.width || '',
                                                   height : widget.properties.height || '',
                                                   alignSelf : widget.properties.alignSelf || '',
                                                   position : widget.properties.position || '',
                                                   boxBoxShadow : widget.properties.boxBoxShadow || '',
                                                   imageBoxShadow : widget.properties.imageBoxShadow || '',










                                   }}

                                   canvasMode={canvasMode}

                                   onSave={(newProperties) =>
                                                            updateWidgetProperties(widget.id, newProperties)
                                           }
                    />}
              {widget.type === 'productGrid' && <ProductGrid widgetData={widget} />}
              {/* Close Icon for Remove Functionality */}
              {canvasMode === 'edit' && (
                <span
                  className="remove-icon"
                  onClick={() => handleRemoveWidget(widget.id)} // Remove widget on click
                >
                  &times;
                </span>
              )}

            </ResizableBox>
          </Draggable>
        ))}
      </div>

      {/* Styling Options Section */}
      {selectedWidgetId && (
        <div className="styling-options">
          <h2>Styling Options</h2>
          {/* Add your styling options here, e.g. color, font size, etc. */}
          {/* You can fetch the widget data using the selectedWidgetId to show current styles */}
          {widgets.map((widget) =>
            widget.id === selectedWidgetId ? (
              <div key={widget.id}>
                <h3>Edit {widget.type}</h3>
                {/* Example: Add input fields for styling */}
                <label>
                  Width:
                  <input
                    type="number"
                    value={widget.width}
                    onChange={(e) =>
                      setWidgets((prev) =>
                        prev.map((w) =>
                          w.id === widget.id ? { ...w, width: parseInt(e.target.value) } : w
                        )
                      )
                    }
                  />
                </label>
                <label>
                  Height:
                  <input
                    type="number"
                    value={widget.height}
                    onChange={(e) =>
                      setWidgets((prev) =>
                        prev.map((w) =>
                          w.id === widget.id ? { ...w, height: parseInt(e.target.value) } : w
                        )
                      )
                    }
                  />
                </label>
                {/* Add more styling options as needed */}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default EditSite;
