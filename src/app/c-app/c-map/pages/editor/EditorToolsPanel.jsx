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
    UndoOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { Switch, Divider, Button, Tooltip } from 'antd';

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
    draftZone,
    onClearAllSlots,
    interactionLocked = false,
}) => {
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('toolType', type);
    };

    const ToolItem = ({ type, label, icon }) => {
        const slotBlocked = !isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT');
        const blocked = interactionLocked || slotBlocked;
        return (
        <div
            className={`tool-btn ${slotBlocked ? 'tool-button--disabled' : ''}`}
            draggable={!blocked && (isBoundaryClosed || (type !== 'SLOT_GROUP' && type !== 'SLOT'))}
            onDragStart={(e) => {
                if (blocked) {
                    e.preventDefault();
                    return;
                }
                if (!isBoundaryClosed && (type === 'SLOT_GROUP' || type === 'SLOT')) {
                    e.preventDefault();
                    return;
                }
                handleDragStart(e, type);
            }}
            title={slotBlocked ? "Draw and close a boundary first" : label}
            style={{
                opacity: blocked ? 0.4 : 1,
                cursor: blocked ? 'not-allowed' : 'grab'
            }}
        >
            {icon}
            <span>{label}</span>
        </div>
    );
    };

    return (
        <div className="tools-container">
            {/* ================= MANAGEMENT ================= */}
            <div className="tools-section">
                <h3>Management</h3>
                <div className="tools-grid">
                    <div
                        className={`tool-btn ${editorMode === 'PAN' ? 'active' : ''}`}
                        onClick={() => {
                            if (interactionLocked) return;
                            setEditorMode(editorMode === 'PAN' ? null : 'PAN');
                        }}
                        style={{
                            backgroundColor: editorMode === 'PAN' ? '#e6f7ff' : 'transparent',
                            borderColor: editorMode === 'PAN' ? '#1890ff' : '#d9d9d9',
                            color: editorMode === 'PAN' ? '#1890ff' : 'inherit',
                            opacity: interactionLocked ? 0.45 : 1,
                            cursor: interactionLocked ? 'not-allowed' : 'pointer',
                        }}
                    >
                        <DragOutlined />
                        <span>Pan</span>
                    </div>

                    <Button
                        className={`tool-btn ${editorMode === 'DRAW_ZONE' ? 'active' : ''} ${!isBoundaryClosed ? 'tool-button--disabled' : ''}`}
                        disabled={interactionLocked || !isBoundaryClosed}
                        title={!isBoundaryClosed ? "Draw a boundary first before adding zones" : "Draw Zone"}
                        onClick={interactionLocked || !isBoundaryClosed ? undefined : onStartDrawZone}
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
                {/* <div style={{ padding: '0 8px' }}>
                    <Tooltip title="Delete all slot groups & slots on this floor">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            disabled={interactionLocked}
                            onClick={onClearAllSlots}
                            style={{ width: '100%', marginTop: 8 }}
                        >
                            Clear All Slots
                        </Button>
                    </Tooltip>
                </div> */}
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
                            disabled={interactionLocked}
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
                                    disabled={interactionLocked}
                                    onClick={onUndoBoundary}
                                    style={{ marginBottom: 8 }}
                                >
                                    Undo Last Point
                                </Button>

                                <Button
                                    block
                                    type="primary"
                                    disabled={interactionLocked}
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
                                disabled={interactionLocked}
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
                            disabled={interactionLocked}
                            onClick={() => {
                                if (interactionLocked) return;
                                setEditorMode(editorMode === 'EDIT_BOUNDARY' ? null : 'EDIT_BOUNDARY');
                            }}
                            style={{ marginBottom: 8 }}
                        >
                            {editorMode === 'EDIT_BOUNDARY' ? "Stop Editing" : "Edit Boundary"}
                        </Button>

                        {/* <Button
                            block
                            danger
                            disabled={interactionLocked}
                            onClick={onClearBoundary}
                        >
                            Clear Boundary
                        </Button> */}
                    </>
                )}

                {editorMode === 'DRAW_ZONE' && (
                    <div style={{ marginTop: '16px' }}>
                        <Button
                            block
                            icon={<UndoOutlined />}
                            disabled={interactionLocked}
                            onClick={onUndoDrawZone}
                            style={{ marginBottom: 8 }}
                        >
                            Undo Last Point
                        </Button>

                        <Button
                            block
                            type="primary"
                            disabled={interactionLocked}
                            onClick={onFinishDrawZone}
                            style={{ marginBottom: 8, backgroundColor: '#10b981', borderColor: '#10b981' }}
                        >
                            Finish Zone Polygon
                        </Button>

                        <Button
                            block
                            disabled={interactionLocked}
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
                        disabled={interactionLocked}
                        onClick={() => {
                            if (interactionLocked) return;
                            setEditorMode(editorMode === 'DRAW_LANE' ? null : 'DRAW_LANE');
                        }}
                        style={{
                            backgroundColor: editorMode === 'DRAW_LANE' ? '#e6f7ff' : 'transparent',
                            borderColor: editorMode === 'DRAW_LANE' ? '#1890ff' : '#d9d9d9',
                            color: editorMode === 'DRAW_LANE' ? '#1890ff' : 'inherit',
                            height: 'auto',
                            padding: '8px',
                            cursor: interactionLocked ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <ArrowRightOutlined />
                            <span>Draw Lane</span>
                        </div>
                    </Button>
                    <div
                        className="tool-btn"
                        draggable={!interactionLocked}
                        onDragStart={(e) => {
                            if (interactionLocked) {
                                e.preventDefault();
                                return;
                            }
                            handleDragStart(e, 'ENTRANCE');
                        }}
                        style={{ opacity: interactionLocked ? 0.45 : 1, cursor: interactionLocked ? 'not-allowed' : 'grab' }}
                    >
                        <GatewayOutlined />
                        <span>Entrance</span>
                    </div>
                    <div
                        className="tool-btn"
                        draggable={!interactionLocked}
                        onDragStart={(e) => {
                            if (interactionLocked) {
                                e.preventDefault();
                                return;
                            }
                            handleDragStart(e, 'EXIT');
                        }}
                        style={{ opacity: interactionLocked ? 0.45 : 1, cursor: interactionLocked ? 'not-allowed' : 'grab' }}
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
