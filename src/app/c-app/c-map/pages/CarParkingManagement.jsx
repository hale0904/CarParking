import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import './CarParkingManagement.scss';

// Canvas constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const CarParkingManagement = () => {
  // State
  const [parkingLot, setParkingLot] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [currentTool, setCurrentTool] = useState('select');
  const [selectedObject, setSelectedObject] = useState(null);
  const [objects, setObjects] = useState({ 1: { slots: [], entrances: [], exits: [], lanes: [] } });
  const [deviceAssignments, setDeviceAssignments] = useState({});
  const [nextSlotId, setNextSlotId] = useState(1);
  const [lotName, setLotName] = useState('Bãi xe Trung tâm');
  const [floorCount, setFloorCount] = useState(2);
  const [laneDirection, setLaneDirection] = useState('one-way');
  const [notification, setNotification] = useState({ message: '', type: '', show: false });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Drawing state
  const [isDrawingLane, setIsDrawingLane] = useState(false);
  const [laneStartPoint, setLaneStartPoint] = useState(null);
  const [tempLaneEnd, setTempLaneEnd] = useState(null);
  const stageRef = useRef(null);

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false });
    }, 3000);
  };

  // Event handlers
  const handleCreateLot = () => {
    if (!lotName.trim()) {
      showNotification('Vui lòng nhập tên bãi xe', 'error');
      return;
    }

    if (floorCount <= 0) {
      showNotification('Số tầng phải là số nguyên dương', 'error');
      return;
    }

    const newParkingLot = {
      name: lotName,
      floorCount,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    };

    setParkingLot(newParkingLot);

    // Initialize floors
    const newObjects = {};
    for (let i = 1; i <= floorCount; i++) {
      newObjects[i] = { slots: [], entrances: [], exits: [], lanes: [] };
    }
    setObjects(newObjects);
    setCurrentFloor(1);
    setNextSlotId(1);

    showNotification(`Đã tạo bãi xe "${lotName}" với ${floorCount} tầng`, 'success');
  };

  const handleStageClick = (e) => {
    // If clicking on empty space
    const stage = e.target.getStage();
    if (e.target === stage) {
      const point = stage.getPointerPosition();

      const floorObjects = objects[currentFloor] || {
        slots: [],
        entrances: [],
        exits: [],
        lanes: [],
      };

      // Handle based on current tool
      if (currentTool === 'slot') {
        const newSlot = {
          id: `P-${nextSlotId.toString().padStart(3, '0')}`,
          x: point.x,
          y: point.y,
          width: 80,
          height: 50,
          angle: 0,
        };

        setObjects((prev) => ({
          ...prev,
          [currentFloor]: {
            ...prev[currentFloor],
            slots: [...prev[currentFloor].slots, newSlot],
          },
        }));

        setNextSlotId((prev) => prev + 1);
        setSelectedObject({ ...newSlot, type: 'slot' });
        setSlotAngle(0);
        setSelectedDeviceId('');

        showNotification(`Đã thêm slot ${newSlot.id}`, 'success');
      } else if (currentTool === 'entrance') {
        const newEntrance = { x: point.x, y: point.y };
        setObjects((prev) => ({
          ...prev,
          [currentFloor]: {
            ...prev[currentFloor],
            entrances: [...prev[currentFloor].entrances, newEntrance],
          },
        }));
        showNotification('Đã thêm lối vào', 'success');
      } else if (currentTool === 'exit') {
        const newExit = { x: point.x, y: point.y };
        setObjects((prev) => ({
          ...prev,
          [currentFloor]: {
            ...prev[currentFloor],
            exits: [...prev[currentFloor].exits, newExit],
          },
        }));
        showNotification('Đã thêm lối ra', 'success');
      } else if (currentTool === 'lane') {
        if (!isDrawingLane) {
          setIsDrawingLane(true);
          setLaneStartPoint({ x: point.x, y: point.y });
          setTempLaneEnd({ x: point.x, y: point.y });
          showNotification('Nhấn vào vị trí kết thúc lane', 'warning');
        } else {
          const newLane = {
            startX: laneStartPoint.x,
            startY: laneStartPoint.y,
            endX: point.x,
            endY: point.y,
            direction: laneDirection,
          };

          setObjects((prev) => ({
            ...prev,
            [currentFloor]: {
              ...prev[currentFloor],
              lanes: [...prev[currentFloor].lanes, newLane],
            },
          }));

          setIsDrawingLane(false);
          setLaneStartPoint(null);
          setTempLaneEnd(null);

          showNotification(
            `Đã thêm lane ${laneDirection === 'one-way' ? 'một chiều' : 'hai chiều'}`,
            'success',
          );
        }
      } else if (currentTool === 'select') {
        setSelectedObject(null);
      }
    }
  };

  const handleStageMouseMove = (e) => {
    if (isDrawingLane && laneStartPoint) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      setTempLaneEnd(point);
    }
  };

  const handleObjectClick = (object, type) => {
    if (currentTool === 'select') {
      setSelectedObject({ ...object, type });
      if (type === 'slot') {
        setSlotAngle(object.angle || 0);
        setSelectedDeviceId(deviceAssignments[object.id] || '');
      }
    } else if (currentTool === 'delete') {
      const floorObjects = objects[currentFloor];
      let updatedObjects = { ...floorObjects };

      if (type === 'slot') {
        updatedObjects.slots = floorObjects.slots.filter((s) => s.id !== object.id);
        if (deviceAssignments[object.id]) {
          const newAssignments = { ...deviceAssignments };
          delete newAssignments[object.id];
          setDeviceAssignments(newAssignments);
        }
      } else if (type === 'entrance') {
        updatedObjects.entrances = floorObjects.entrances.filter(
          (e) => !(e.x === object.x && e.y === object.y),
        );
      } else if (type === 'exit') {
        updatedObjects.exits = floorObjects.exits.filter(
          (e) => !(e.x === object.x && e.y === object.y),
        );
      } else if (type === 'lane') {
        updatedObjects.lanes = floorObjects.lanes.filter(
          (l) =>
            !(
              l.startX === object.startX &&
              l.startY === object.startY &&
              l.endX === object.endX &&
              l.endY === object.endY
            ),
        );
      }

      setObjects((prev) => ({ ...prev, [currentFloor]: updatedObjects }));
      setSelectedObject(null);
      showNotification('Đã xóa đối tượng', 'success');
    }
  };

  const handleSlotDragEnd = (slot, e) => {
    const updatedSlot = {
      ...slot,
      x: e.target.x(),
      y: e.target.y(),
    };

    const floorObjects = objects[currentFloor];
    const slotIndex = floorObjects.slots.findIndex((s) => s.id === slot.id);
    if (slotIndex !== -1) {
      const updatedSlots = [...floorObjects.slots];
      updatedSlots[slotIndex] = updatedSlot;

      setObjects((prev) => ({
        ...prev,
        [currentFloor]: { ...prev[currentFloor], slots: updatedSlots },
      }));

      if (selectedObject?.id === slot.id) {
        setSelectedObject({ ...updatedSlot, type: 'slot' });
      }
    }
  };

  const handleEntranceDragEnd = (entrance, e) => {
    const updatedEntrance = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const floorObjects = objects[currentFloor];
    const entranceIndex = floorObjects.entrances.findIndex(
      (e) => e.x === entrance.x && e.y === entrance.y,
    );
    if (entranceIndex !== -1) {
      const updatedEntrances = [...floorObjects.entrances];
      updatedEntrances[entranceIndex] = updatedEntrance;

      setObjects((prev) => ({
        ...prev,
        [currentFloor]: { ...prev[currentFloor], entrances: updatedEntrances },
      }));

      if (selectedObject?.x === entrance.x && selectedObject?.y === entrance.y) {
        setSelectedObject({ ...updatedEntrance, type: 'entrance' });
      }
    }
  };

  const handleExitDragEnd = (exit, e) => {
    const updatedExit = {
      x: e.target.x(),
      y: e.target.y(),
    };

    const floorObjects = objects[currentFloor];
    const exitIndex = floorObjects.exits.findIndex((e) => e.x === exit.x && e.y === exit.y);
    if (exitIndex !== -1) {
      const updatedExits = [...floorObjects.exits];
      updatedExits[exitIndex] = updatedExit;

      setObjects((prev) => ({
        ...prev,
        [currentFloor]: { ...prev[currentFloor], exits: updatedExits },
      }));

      if (selectedObject?.x === exit.x && selectedObject?.y === exit.y) {
        setSelectedObject({ ...updatedExit, type: 'exit' });
      }
    }
  };

  const handleLaneDragEnd = (lane, e, isStart) => {
    const updatedLane = isStart
      ? {
          ...lane,
          startX: e.target.x(),
          startY: e.target.y(),
        }
      : {
          ...lane,
          endX: e.target.x(),
          endY: e.target.y(),
        };

    const floorObjects = objects[currentFloor];
    const laneIndex = floorObjects.lanes.findIndex(
      (l) =>
        l.startX === lane.startX &&
        l.startY === lane.startY &&
        l.endX === lane.endX &&
        l.endY === lane.endY,
    );

    if (laneIndex !== -1) {
      const updatedLanes = [...floorObjects.lanes];
      updatedLanes[laneIndex] = updatedLane;

      setObjects((prev) => ({
        ...prev,
        [currentFloor]: { ...prev[currentFloor], lanes: updatedLanes },
      }));

      if (
        selectedObject?.startX === lane.startX &&
        selectedObject?.startY === lane.startY &&
        selectedObject?.endX === lane.endX &&
        selectedObject?.endY === lane.endY
      ) {
        setSelectedObject({ ...updatedLane, type: 'lane' });
      }
    }
  };

  const handleSaveLayout = () => {
    if (!parkingLot) {
      showNotification('Vui lòng tạo bãi xe trước', 'error');
      return;
    }

    const layout = {
      parkingLot,
      objects,
      deviceAssignments,
      nextSlotId,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem('parkingLotLayout', JSON.stringify(layout));
    showNotification('Đã lưu layout thành công', 'success');
  };

  const handleLoadLayout = () => {
    const savedLayout = localStorage.getItem('parkingLotLayout');

    if (!savedLayout) {
      showNotification('Không tìm thấy layout đã lưu', 'error');
      return;
    }

    try {
      const layout = JSON.parse(savedLayout);

      setParkingLot(layout.parkingLot);
      setObjects(layout.objects);
      setDeviceAssignments(layout.deviceAssignments || {});
      setNextSlotId(layout.nextSlotId || 1);
      setCurrentFloor(1);

      setLotName(layout.parkingLot.name);
      setFloorCount(layout.parkingLot.floorCount);

      showNotification(`Đã load layout "${layout.parkingLot.name}"`, 'success');
    } catch (error) {
      showNotification('Lỗi khi load layout', 'error');
      console.error(error);
    }
  };

  const handleToolSelect = (tool) => {
    setCurrentTool(tool);
    if (tool !== 'select') {
      setSelectedObject(null);
    }
    setIsDrawingLane(false);
    setLaneStartPoint(null);
    setTempLaneEnd(null);
  };

  const handleFloorChange = (floor) => {
    setCurrentFloor(floor);
    setSelectedObject(null);
    setIsDrawingLane(false);
    setLaneStartPoint(null);
    setTempLaneEnd(null);
  };

  // Render Grid Component
  const Grid = () => {
    const gridSize = 50;
    const lines = [];

    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, CANVAS_HEIGHT]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />,
      );
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, CANVAS_WIDTH, y]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />,
      );
    }

    return <>{lines}</>;
  };

  // Render Slot Component
  const SlotComponent = ({ slot }) => {
    const isSelected = selectedObject?.id === slot.id && selectedObject?.type === 'slot';
    const width = slot.width || 80;
    const height = slot.height || 50;
    const angle = slot.angle || 0;

    const handleRotationHandleDrag = (e) => {
      const node = e.target;
      const group = node.getParent();
      const stage = node.getStage();
      const pointerPos = stage.getPointerPosition();

      // Get group position in stage coordinates
      const groupPos = group.getAbsolutePosition();

      // Calculate angle from group center to mouse position
      const deltaX = pointerPos.x - groupPos.x;
      const deltaY = pointerPos.y - groupPos.y;
      let newAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90;

      // Normalize angle to 0-360
      if (newAngle < 0) newAngle += 360;
      if (newAngle >= 360) newAngle -= 360;

      // Update rotation
      group.rotation(newAngle);
      setSlotAngle(Math.round(newAngle));

      // Update slot in state
      const updatedSlot = {
        ...slot,
        angle: newAngle,
      };

      const floorObjects = objects[currentFloor];
      const slotIndex = floorObjects.slots.findIndex((s) => s.id === slot.id);
      if (slotIndex !== -1) {
        const updatedSlots = [...floorObjects.slots];
        updatedSlots[slotIndex] = updatedSlot;

        setObjects((prev) => ({
          ...prev,
          [currentFloor]: { ...prev[currentFloor], slots: updatedSlots },
        }));

        if (selectedObject?.id === slot.id) {
          setSelectedObject({ ...updatedSlot, type: 'slot' });
        }
      }
    };

    const handleRotationHandleDragEnd = () => {
      // Reset handle position after drag (handle stays at fixed position relative to group)
      const group = stageRef.current?.findOne(`.slot-group-${slot.id}`);
      const handle = group?.findOne('.rotation-handle');
      if (handle) {
        handle.position({ x: 0, y: -height / 2 - 20 });
      }
    };

    return (
      <Group
        className={`slot-group-${slot.id}`}
        x={slot.x}
        y={slot.y}
        rotation={angle}
        draggable={currentTool === 'select' && isSelected}
        onClick={() => handleObjectClick(slot, 'slot')}
        onDragEnd={(e) => handleSlotDragEnd(slot, e)}
      >
        {/* Slot rectangle */}
        <Rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          fill="#3498db"
          stroke="#2980b9"
          strokeWidth={2}
        />

        {/* Slot ID text */}
        <Text
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          text={slot.id}
          fontSize={16}
          fontStyle="bold"
          fill="white"
          align="center"
          verticalAlign="middle"
          listening={false}
        />

        {/* Selection highlight */}
        {isSelected && (
          <>
            <Rect
              x={-width / 2 - 5}
              y={-height / 2 - 5}
              width={width + 10}
              height={height + 10}
              stroke="#f39c12"
              strokeWidth={3}
              dash={[5, 5]}
              listening={false}
            />
            {/* Rotation handle */}
            <Circle
              className="rotation-handle"
              x={0}
              y={-height / 2 - 20}
              radius={8}
              fill="#f39c12"
              draggable={currentTool === 'select'}
              onDragMove={handleRotationHandleDrag}
              onDragEnd={handleRotationHandleDragEnd}
            />
          </>
        )}
      </Group>
    );
  };

  // Render Entrance Component
  const EntranceComponent = ({ entrance }) => {
    const isSelected =
      selectedObject?.x === entrance.x &&
      selectedObject?.y === entrance.y &&
      selectedObject?.type === 'entrance';

    return (
      <Group
        x={entrance.x}
        y={entrance.y}
        draggable={currentTool === 'select' && isSelected}
        onClick={() => handleObjectClick(entrance, 'entrance')}
        onDragEnd={(e) => handleEntranceDragEnd(entrance, e)}
      >
        <Circle radius={25} fill="#27ae60" stroke="white" strokeWidth={3} />
        <Text
          text="↓"
          fontSize={20}
          fontStyle="bold"
          fill="white"
          align="center"
          verticalAlign="middle"
          x={-10}
          y={-10}
          width={20}
          height={20}
          listening={false}
        />
        {isSelected && (
          <Circle radius={35} stroke="#f39c12" strokeWidth={3} dash={[5, 5]} listening={false} />
        )}
      </Group>
    );
  };

  // Render Exit Component
  const ExitComponent = ({ exit }) => {
    const isSelected =
      selectedObject?.x === exit.x &&
      selectedObject?.y === exit.y &&
      selectedObject?.type === 'exit';

    return (
      <Group
        x={exit.x}
        y={exit.y}
        draggable={currentTool === 'select' && isSelected}
        onClick={() => handleObjectClick(exit, 'exit')}
        onDragEnd={(e) => handleExitDragEnd(exit, e)}
      >
        <Rect
          x={-20}
          y={-20}
          width={40}
          height={40}
          fill="#e74c3c"
          stroke="white"
          strokeWidth={3}
        />
        <Text
          text="↑"
          fontSize={20}
          fontStyle="bold"
          fill="white"
          align="center"
          verticalAlign="middle"
          x={-10}
          y={-10}
          width={20}
          height={20}
          listening={false}
        />
        {isSelected && (
          <Circle radius={35} stroke="#f39c12" strokeWidth={3} dash={[5, 5]} listening={false} />
        )}
      </Group>
    );
  };

  // Render Arrow Component
  const ArrowComponent = ({ startX, startY, endX, endY, color }) => {
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = 20;
    const headWidth = 15;

    // Calculate arrowhead points
    const x1 = endX - headLength * Math.cos(angle - Math.PI / 6);
    const y1 = endY - headLength * Math.sin(angle - Math.PI / 6);
    const x2 = endX - headLength * Math.cos(angle + Math.PI / 6);
    const y2 = endY - headLength * Math.sin(angle + Math.PI / 6);

    return (
      <Line
        points={[endX, endY, x1, y1, x2, y2, endX, endY]}
        fill={color}
        stroke={color}
        strokeWidth={8}
        closed={true}
        listening={false}
      />
    );
  };

  // Render Lane Component
  const LaneComponent = ({ lane }) => {
    const isSelected =
      selectedObject?.startX === lane.startX &&
      selectedObject?.startY === lane.startY &&
      selectedObject?.endX === lane.endX &&
      selectedObject?.endY === lane.endY &&
      selectedObject?.type === 'lane';

    const strokeColor = lane.direction === 'one-way' ? '#9b59b6' : '#f1c40f';

    return (
      <Group>
        {/* Lane line */}
        <Line
          points={[lane.startX, lane.startY, lane.endX, lane.endY]}
          stroke={strokeColor}
          strokeWidth={8}
          lineCap="round"
          onClick={() => handleObjectClick(lane, 'lane')}
        />

        {/* Arrow for one-way lanes */}
        {lane.direction === 'one-way' && (
          <ArrowComponent
            startX={lane.startX}
            startY={lane.startY}
            endX={lane.endX}
            endY={lane.endY}
            color={strokeColor}
          />
        )}

        {/* Selection endpoints */}
        {isSelected && currentTool === 'select' && (
          <>
            <Circle
              x={lane.startX}
              y={lane.startY}
              radius={10}
              fill="#f39c12"
              draggable={true}
              onDragEnd={(e) => handleLaneDragEnd(lane, e, true)}
            />
            <Circle
              x={lane.endX}
              y={lane.endY}
              radius={10}
              fill="#f39c12"
              draggable={true}
              onDragEnd={(e) => handleLaneDragEnd(lane, e, false)}
            />
          </>
        )}
      </Group>
    );
  };

  // Get current floor objects
  const floorObjects = objects[currentFloor] || {
    slots: [],
    entrances: [],
    exits: [],
    lanes: [],
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <i className="fas fa-parking"></i>
          <h1>Hệ Thống Thiết Kế Bãi Đỗ Xe</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-success" onClick={handleSaveLayout}>
            <i className="fas fa-save"></i> Lưu Layout
          </button>
          <button className="btn btn-primary" onClick={handleLoadLayout}>
            <i className="fas fa-folder-open"></i> Load Layout
          </button>
          <button className="mobile-toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
          {/* Create Parking Lot Section */}
          <div className="sidebar-section">
            <h2 className="sidebar-title">
              <i className="fas fa-plus-circle"></i> Tạo Bãi Đỗ Xe
            </h2>
            <div className="form-group">
              <label htmlFor="lot-name">Tên bãi xe:</label>
              <input
                type="text"
                id="lot-name"
                placeholder="Nhập tên bãi xe"
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="floor-count">
                Số tầng: <span className="optional">(không bắt buộc)</span>
              </label>
              <input
                type="number"
                id="floor-count"
                min="1"
                value={floorCount}
                onChange={(e) => setFloorCount(parseInt(e.target.value) || 1)}
                placeholder="Mặc định: 1"
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleCreateLot}>
              <i className="fas fa-parking"></i> Tạo Bãi Đỗ Xe
            </button>
          </div>

          {/* Floor Selection Section */}
          {parkingLot && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">
                <i className="fas fa-layer-group"></i> Chọn Tầng
              </h2>
              <div className="floors-tabs">
                {Array.from({ length: floorCount }, (_, i) => i + 1).map((floor) => (
                  <div
                    key={floor}
                    className={`floor-tab ${currentFloor === floor ? 'active' : ''}`}
                    onClick={() => handleFloorChange(floor)}
                  >
                    Tầng {floor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools Section */}
          {parkingLot && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">
                <i className="fas fa-tools"></i> Công Cụ
              </h2>
              <div className="toolbar">
                <button
                  className={`tool-btn ${currentTool === 'slot' ? 'active' : ''}`}
                  onClick={() => handleToolSelect('slot')}
                >
                  <i className="fas fa-square"></i> Thêm Slot
                </button>
                <button
                  className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
                  onClick={() => handleToolSelect('select')}
                >
                  <i className="fas fa-mouse-pointer"></i> Chọn
                </button>
                <button
                  className={`tool-btn ${currentTool === 'delete' ? 'active' : ''}`}
                  onClick={() => handleToolSelect('delete')}
                >
                  <i className="fas fa-trash"></i> Xóa
                </button>
              </div>
              <div className="toolbar">
                <button
                  className={`tool-btn ${currentTool === 'entrance' ? 'active' : ''}`}
                  onClick={() => handleToolSelect('entrance')}
                >
                  <i className="fas fa-sign-in-alt"></i> Lối vào
                </button>
                <button
                  className={`tool-btn ${currentTool === 'exit' ? 'active' : ''}`}
                  onClick={() => handleToolSelect('exit')}
                >
                  <i className="fas fa-sign-out-alt"></i> Lối ra
                </button>
                <button
                  className={`tool-btn ${currentTool === 'lane' ? 'active' : ''}`}
                  onClick={() => handleToolSelect('lane')}
                >
                  <i className="fas fa-road"></i> Vẽ Lane
                </button>
              </div>
            </div>
          )}

          {/* Lane Direction Section */}
          {parkingLot && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">
                <i className="fas fa-directions"></i> Loại Lane
              </h2>
              <div className="form-group">
                <label htmlFor="lane-direction">Hướng lane:</label>
                <select
                  id="lane-direction"
                  value={laneDirection}
                  onChange={(e) => setLaneDirection(e.target.value)}
                >
                  <option value="one-way">Một chiều</option>
                  <option value="two-way">Hai chiều</option>
                </select>
              </div>
              <p className="optional">Chọn "Một chiều" để vẽ lane có mũi tên chỉ hướng</p>
            </div>
          )}

          {/* Legend Section */}
          <div className="sidebar-section">
            <h2 className="sidebar-title">
              <i className="fas fa-info-circle"></i> Chú Thích
            </h2>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-color slot-color"></div>
                <span>Parking Slot</span>
              </div>
              <div className="legend-item">
                <div className="legend-color entrance-color"></div>
                <span>Lối vào</span>
              </div>
              <div className="legend-item">
                <div className="legend-color exit-color"></div>
                <span>Lối ra</span>
              </div>
              <div className="legend-item">
                <div className="legend-color lane-one-way-color"></div>
                <span>Lane một chiều</span>
              </div>
              <div className="legend-item">
                <div className="legend-color lane-two-way-color"></div>
                <span>Lane hai chiều</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Canvas Container */}
        <main className="canvas-container">
          <div className="canvas-header">
            <h2 className="canvas-title">
              {parkingLot ? `Layout Editor - ${parkingLot.name}` : 'Layout Editor'}
            </h2>
            <div className="current-floor">
              {parkingLot ? (
                <span>
                  <strong>Tầng hiện tại:</strong> Tầng {currentFloor}
                </span>
              ) : (
                <span className="optional">Chưa có bãi xe nào được tạo</span>
              )}
            </div>
          </div>

          <div className="canvas-area">
            {parkingLot ? (
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleStageClick}
                onMouseMove={handleStageMouseMove}
              >
                <Layer>
                  {/* Grid */}
                  <Grid />

                  {/* Lanes (drawn first, so they appear under other objects) */}
                  {floorObjects.lanes.map((lane, index) => (
                    <LaneComponent key={`lane-${index}`} lane={lane} />
                  ))}

                  {/* Temporary lane being drawn */}
                  {isDrawingLane && laneStartPoint && tempLaneEnd && (
                    <>
                      <Line
                        points={[laneStartPoint.x, laneStartPoint.y, tempLaneEnd.x, tempLaneEnd.y]}
                        stroke="#9b59b6"
                        strokeWidth={8}
                        lineCap="round"
                        dash={[10, 5]}
                        listening={false}
                      />
                      {laneDirection === 'one-way' && (
                        <ArrowComponent
                          startX={laneStartPoint.x}
                          startY={laneStartPoint.y}
                          endX={tempLaneEnd.x}
                          endY={tempLaneEnd.y}
                          color="#9b59b6"
                        />
                      )}
                    </>
                  )}

                  {/* Slots */}
                  {floorObjects.slots.map((slot) => (
                    <SlotComponent key={slot.id} slot={slot} />
                  ))}

                  {/* Entrances */}
                  {floorObjects.entrances.map((entrance, index) => (
                    <EntranceComponent key={`entrance-${index}`} entrance={entrance} />
                  ))}

                  {/* Exits */}
                  {floorObjects.exits.map((exit, index) => (
                    <ExitComponent key={`exit-${index}`} exit={exit} />
                  ))}
                </Layer>
              </Stage>
            ) : (
              <div
                style={{
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #ccc',
                  color: '#999',
                }}
              >
                Vui lòng tạo bãi xe để bắt đầu
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}
    </div>
  );
};

export default CarParkingManagement;
