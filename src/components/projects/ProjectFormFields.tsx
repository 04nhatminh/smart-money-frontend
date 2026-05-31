import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { InputField } from '../InputField';
import { projectStyles as styles } from '../../styles/projectStyles';
import { CreateProjectFormErrors } from '../../types/project.types';
import { ProjectPriority, PROJECT_PRIORITIES } from '../../types/project.types';


type Props = {
    name: string;
    description: string;
    targetAmount: string;
    priority: ProjectPriority;
    deadlineMonths: string;
    errors: CreateProjectFormErrors;
    previewDeadline: string;
    availablePriorities?: ProjectPriority[];
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
    availablePriorities,
}: Props) {
    const disabledPriorities = PROJECT_PRIORITIES.filter(
        (p) => !availablePriorities?.includes(p)
    );
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

                <View style={styles.priorityContainer}>

                {PROJECT_PRIORITIES.map((item) => {

                    const active = priority === item;
                    const used = !availablePriorities?.includes(item);
                    const disabled = used && !active;

                    return (
                        <Pressable
                            key={item}
                            disabled={disabled}
                            style={[
                                styles.priorityCard,

                                active &&
                                    styles.priorityCardActive,

                                used &&
                                    !active &&
                                    styles.priorityCardDisabled,
                            ]}
                            onPress={() =>
                                onChangePriority(item)
                            }
                        >

                            <View style={styles.priorityHeader}>

                                <Text
                                    style={[
                                        styles.priorityTitle,

                                        active &&
                                            styles.priorityTitleActive,

                                        used &&
                                            !active &&
                                            styles.priorityTitleDisabled,
                                    ]}
                                >
                                    {item}
                                </Text>

                                {used && !active && (
                                    <View style={styles.usedBadge}>
                                        <Text style={styles.usedBadgeText}>
                                            Used
                                        </Text>
                                    </View>
                                )}

                            </View>

                            <Text
                                style={[
                                    styles.priorityDescription,

                                    used &&
                                        !active &&
                                        styles.priorityDescriptionDisabled,
                                ]}
                            >

                                {item === "HIGH" &&
                                    "Fast saving pace"}

                                {item === "MEDIUM" &&
                                    "Balanced saving plan"}

                                {item === "LOW" &&
                                    "Flexible saving pace"}

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

