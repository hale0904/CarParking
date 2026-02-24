import React from 'react';
import {
    BorderOuterOutlined,
    AppstoreOutlined,
    CarOutlined,
    GatewayOutlined,
    ArrowRightOutlined,
    BuildOutlined,
    BorderOutlined,
    EditOutlined,
    DragOutlined,
    UndoOutlined
} from '@ant-design/icons';
import { Switch, Divider, Button } from 'antd';

const EditorToolsPanel = ({

    editorMode,
    setEditorMode,
    onStartDraw,
    onFinishDraw,
    onClearBoundary,
    onCancelDraw,
    onUndoBoundary,
    hasBoundary,
    isBoundaryClosed,
    onStartDrawZone,
    onFinishDrawZone,
    onCancelDrawZone,
    onUndoDrawZone,
    draftZone
}) => {
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('toolType', type);
    };

    const ToolItem = ({ type, label, icon }) => (
        <div
            className="tool-btn"
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
        >
            {icon}
            <span>{label}</span>
        </div>
    );

    return (
        <div className="tools-container">
            {/* ================= MANAGEMENT ================= */}
            <div className="tools-section">
                <h3>Management</h3>
                <div className="tools-grid">
                    <div
                        className={`tool-btn ${editorMode === 'PAN' ? 'active' : ''}`}
                        onClick={() => setEditorMode(editorMode === 'PAN' ? null : 'PAN')}
                        style={{
                            backgroundColor: editorMode === 'PAN' ? '#e6f7ff' : 'transparent',
                            borderColor: editorMode === 'PAN' ? '#1890ff' : '#d9d9d9',
                            color: editorMode === 'PAN' ? '#1890ff' : 'inherit'
                        }}
                    >
                        <DragOutlined />
                        <span>Pan</span>
                    </div>

                    <div
                        className={`tool-btn ${editorMode === 'DRAW_ZONE' ? 'active' : ''}`}
                        onClick={onStartDrawZone}
                        style={{
                            backgroundColor: editorMode === 'DRAW_ZONE' ? '#e6f7ff' : 'transparent',
                            borderColor: editorMode === 'DRAW_ZONE' ? '#1890ff' : '#d9d9d9',
                            color: editorMode === 'DRAW_ZONE' ? '#1890ff' : 'inherit'
                        }}
                    >
                        <BorderOuterOutlined />
                        <span>Zone</span>
                    </div>
                    <ToolItem
                        type="SLOT_GROUP"
                        label="Slot Group"
                        icon={<AppstoreOutlined />}
                    />
                    <ToolItem
                        type="SLOT"
                        label="Single Slot"
                        icon={<CarOutlined />}
                    />
                </div>
            </div>

            <Divider />

            {/* ================= BOUNDARY ================= */}
            <div className="tools-section">
                <h3>Boundary</h3>

                {!isBoundaryClosed ? (
                    <>
                        <Button
                            block
                            icon={<BorderOutlined />}
                            type={editorMode === 'DRAW_BOUNDARY' ? 'primary' : 'default'}
                            onClick={onStartDraw}
                            style={{ marginBottom: 8 }}
                        >
                            {hasBoundary ? "Continue Drawing" : "Draw Boundary"}
                        </Button>

                        {hasBoundary && (
                            <>
                                <Button
                                    block
                                    icon={<UndoOutlined />}
                                    onClick={onUndoBoundary}
                                    style={{ marginBottom: 8 }}
                                >
                                    Undo Last Point
                                </Button>

                                <Button
                                    block
                                    type="primary"
                                    onClick={onFinishDraw}
                                    style={{ marginBottom: 8, backgroundColor: '#10b981', borderColor: '#10b981' }}
                                >
                                    Finish Polygon
                                </Button>
                            </>
                        )}

                        {editorMode === 'DRAW_BOUNDARY' && (
                            <Button
                                block
                                onClick={onCancelDraw}
                            >
                                Cancel
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            block
                            icon={<EditOutlined />}
                            type={editorMode === 'EDIT_BOUNDARY' ? 'primary' : 'default'}
                            onClick={() => setEditorMode(editorMode === 'EDIT_BOUNDARY' ? null : 'EDIT_BOUNDARY')}
                            style={{ marginBottom: 8 }}
                        >
                            {editorMode === 'EDIT_BOUNDARY' ? "Stop Editing" : "Edit Boundary"}
                        </Button>

                        <Button
                            block
                            danger
                            onClick={onClearBoundary}
                        >
                            Clear Boundary
                        </Button>
                    </>
                )}

                {editorMode === 'DRAW_ZONE' && (
                    <div style={{ marginTop: '16px' }}>
                        <Button
                            block
                            icon={<UndoOutlined />}
                            onClick={onUndoDrawZone}
                            style={{ marginBottom: 8 }}
                        >
                            Undo Last Point
                        </Button>

                        <Button
                            block
                            type="primary"
                            onClick={onFinishDrawZone}
                            style={{ marginBottom: 8, backgroundColor: '#10b981', borderColor: '#10b981' }}
                        >
                            Finish Zone Polygon
                        </Button>

                        <Button
                            block
                            onClick={onCancelDrawZone}
                        >
                            Cancel Zone
                        </Button>
                    </div>
                )}
            </div>

            <Divider />

            {/* ================= TRAFFIC FLOW ================= */}
            <div className="tools-section">
                <h3>Traffic Flow</h3>
                <div className="tools-grid">
                    <div
                        className="tool-btn"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'LANE')}
                    >
                        <ArrowRightOutlined />
                        <span>Lane</span>
                    </div>
                    <div
                        className="tool-btn"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'ENTRANCE')}
                    >
                        <GatewayOutlined />
                        <span>Entrance</span>
                    </div>
                    <div
                        className="tool-btn"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'EXIT')}
                    >
                        <GatewayOutlined style={{ transform: 'rotate(180deg)' }} />
                        <span>Exit</span>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default EditorToolsPanel;
