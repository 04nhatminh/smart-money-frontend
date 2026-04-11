import React from 'react';
import { Text } from 'react-native';
import { InputField } from '../InputField';
import { projectStyles as styles } from '../../styles/projectStyles';
import { CreateProjectFormErrors } from '../../types/project.types';

type Props = {
    name: string;
    description: string;
    targetAmount: string;
    deadlineMonths: string;
    errors: CreateProjectFormErrors;
    previewDeadline: string;
    onChangeName: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onChangeTargetAmount: (value: string) => void;
    onChangeDeadlineMonths: (value: string) => void;
};

export default function ProjectFormFields({
    name,
    targetAmount,
    deadlineMonths,
    description,
    errors,
    previewDeadline,
    onChangeName,
    onChangeTargetAmount,
    onChangeDeadlineMonths,
    onChangeDescription,
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

