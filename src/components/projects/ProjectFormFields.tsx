import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { InputField } from '../InputField';
import { projectStyles as styles } from '../../styles/projectStyles';
import { CreateProjectFormErrors } from '../../types/project.types';
import { ProjectPriority } from '../../types/project.types';

const PRIORITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'] as const;

type Props = {
    name: string;
    description: string;
    targetAmount: string;
    priority: ProjectPriority;
    deadlineMonths: string;
    errors: CreateProjectFormErrors;
    previewDeadline: string;
    onChangeName: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onChangeTargetAmount: (value: string) => void;
    onChangeDeadlineMonths: (value: string) => void;
    onChangePriority: (value: ProjectPriority) => void;
};

export default function ProjectFormFields({
    name,
    targetAmount,
    deadlineMonths,
    priority,
    description,
    errors,
    previewDeadline,
    onChangeName,
    onChangeTargetAmount,
    onChangeDeadlineMonths,
    onChangeDescription,
    onChangePriority,
}: Props) {
    return (
        <>
            <Text style={styles.name}>Name</Text>
            <InputField
                iconName="folder-outline"
                placeholder="Name"
                value={name}
                onChangeText={onChangeName}
                autoCapitalize="sentences"
                error={errors.name}
            />

            <Text style={styles.name}>Target Amount</Text>
            <InputField
                iconName="wallet-outline"
                placeholder="Target Amount"
                value={targetAmount}
                onChangeText={onChangeTargetAmount}
                keyboardType="numeric"
                rightText="VND"
                error={errors.targetAmount}
            />

            <Text style={styles.name}>Deadline</Text>
            <InputField
                placeholder="Deadline (Months)"
                value={deadlineMonths}
                onChangeText={onChangeDeadlineMonths}
                rightText="months"
                error={errors.deadlineMonths}
            />

            {!!previewDeadline && (
                <Text style={styles.helperText}>Deadline date: {previewDeadline}</Text>
            )}

            <Text style={styles.name}>Priority</Text>

                <View style={styles.typeRow}>
                {["HIGH", "MEDIUM", "LOW"].map((item) => {
                    const active = priority === item;

                    return (
                    <Pressable
                        key={item}
                        style={[
                        styles.typeBtn,
                        active && styles.typeBtnActive,
                        ]}
                        onPress={() => onChangePriority(item as ProjectPriority)}
                    >
                        <Text
                        style={[
                            styles.typeButtonText,
                            active && styles.typeButtonTextActive,
                        ]}
                        >
                        {item}
                        </Text>
                    </Pressable>
                    );
                })}
                </View>

            <Text style={styles.name}>Description</Text>
            <InputField
                iconName="document-text-outline"
                placeholder="Description"
                value={description}
                onChangeText={onChangeDescription}
                multiline
                numberOfLines={4}
                autoCapitalize="sentences"
                error={errors.description}
            />
            
            

        </>
    )
}

