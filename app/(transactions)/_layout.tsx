import { Stack } from "expo-router";

export default function TransactionLayout() {
    return (
        <Stack>
            {/* <Stack.Screen 
                name="index"
                options={{
                    title: "Transactions"
            }}
            /> */}

            <Stack.Screen 
                name="addTransaction" 
                options={{
                    title: "Add Transaction"
            }}
            />

            <Stack.Screen
                name="editTransaction"
                options={{
                    title: "Edit Transaction"
            }}
            />

            <Stack.Screen
                name="transactionDetail"
                options={{  
                    title: "Transaction Detail"
            }}
            />
            
        </Stack>
    );
}
        