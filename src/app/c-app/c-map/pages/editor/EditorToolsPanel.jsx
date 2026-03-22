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
            className={`tool-btn ${!isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT') ? 'tool-button--disabled' : ''}`}
            draggable={isBoundaryClosed || (type !== 'SLOT_GROUP' && type !== 'SLOT')}
            onDragStart={(e) => {
                if (!isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT')) {
                    e.preventDefault();
                    return;
                }
                handleDragStart(e, type);
            }}
            title={(!isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT')) ? "Draw and close a boundary first" : label}
            style={{
                opacity: (!isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT')) ? 0.4 : 1,
                cursor: (!isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT')) ? 'not-allowed' : 'grab'
            }}
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

                    <Button
                        className={`tool-btn ${editorMode === 'DRAW_ZONE' ? 'active' : ''} ${!isBoundaryClosed ? 'tool-button--disabled' : ''}`}
                        disabled={!isBoundaryClosed}
                        title={!isBoundaryClosed ? "Draw a boundary first before adding zones" : "Draw Zone"}
                        onClick={!isBoundaryClosed ? undefined : onStartDrawZone}
                        style={{
                            backgroundColor: editorMode === 'DRAW_ZONE' ? '#e6f7ff' : 'transparent',
                            borderColor: editorMode === 'DRAW_ZONE' ? '#1890ff' : '#d9d9d9',
                            color: editorMode === 'DRAW_ZONE' ? '#1890ff' : 'inherit',
                            height: 'auto',
                            padding: '8px',
                            opacity: !isBoundaryClosed ? 0.4 : 1,
                            cursor: !isBoundaryClosed ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <BorderOuterOutlined />
                            <span>Zone</span>
                        </div>
                    </Button>
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
                    <Button
                        className={`tool-btn ${editorMode === 'DRAW_LANE' ? 'active' : ''}`}
                        title="Click to place nodes, click existing node to connect"
                        onClick={() => setEditorMode(editorMode === 'DRAW_LANE' ? null : 'DRAW_LANE')}
                        style={{
                            backgroundColor: editorMode === 'DRAW_LANE' ? '#e6f7ff' : 'transparent',
                            borderColor: editorMode === 'DRAW_LANE' ? '#1890ff' : '#d9d9d9',
                            color: editorMode === 'DRAW_LANE' ? '#1890ff' : 'inherit',
                            height: 'auto',
                            padding: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <ArrowRightOutlined />
                            <span>Draw Lane</span>
                        </div>
                    </Button>
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
