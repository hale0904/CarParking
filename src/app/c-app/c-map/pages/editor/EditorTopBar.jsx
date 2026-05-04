import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip, Typography } from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    StopOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const EditorTopBar = ({ parkingName = "New Parking Map", onSave, onCancel, isSaving }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="editor-top-bar">
            {/* Left: Back Button */}
            <div className="top-bar-left">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                    disabled={isSaving}
                >
                    Back
                </Button>
            </div>

            {/* Center: Title */}
            <div className="top-bar-center">
                <Title level={5} style={{ margin: 0 }}>{parkingName}</Title>
            </div>

            {/* Right: Actions */}
            <div className="top-bar-right">
                <Tooltip title="Cancel modifications">
                    <Button
                        icon={<StopOutlined />}
                        onClick={onCancel}
                        danger
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                </Tooltip>

                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={onSave}
                    disabled={isSaving}
                    loading={isSaving}
                >
                    Save Map
                </Button>
            </div>
        </div>
    );
};

export default EditorTopBar;
