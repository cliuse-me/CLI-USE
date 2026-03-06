import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { AVAILABLE_MODELS, ModelConfig } from '../lib/models';

interface Props {
    onSelect: (config: ModelConfig) => void;
}

export const ModelSelector = ({ onSelect }: Props) => {
    const items = AVAILABLE_MODELS.map(m => ({
        label: m.label,
        value: m.value,
        provider: m.provider,
        pkg: m.pkg
    }));

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
            <Text bold color="cyan">🧠 Select your AI Tech Lead:</Text>
            <Box marginTop={1}>
                <SelectInput
                    items={items}
                    onSelect={(item: any) => {
                        onSelect({
                            provider: item.provider,
                            modelId: item.value,
                            pkg: item.pkg
                        });
                    }}
                />
            </Box>
        </Box>
    );
};