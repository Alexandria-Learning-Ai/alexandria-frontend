import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function DatabaseTableVisualization({
    tables = [],
    schema = {},
    interactive = false,
    onInteraction,
    style,
    theme = 'light'
}) {
    const [selectedTable, setSelectedTable] = useState(0);
    const [selectedCells, setSelectedCells] = useState(new Set());
    const [showQuery, setShowQuery] = useState(false);
    const [queryText, setQueryText] = useState('');
    const [highlightedRows, setHighlightedRows] = useState(new Set());

    const colors = theme === 'dark' ? {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        primary: '#D4AF37',
        text: '#ffffff',
        textSecondary: '#cccccc',
        border: '#444444',
        headerBg: '#1A2C5B',
        selectedBg: '#3A4F7A',
        highlightBg: '#2A3F5F'
    } : {
        background: '#ffffff',
        surface: '#f8f9fa',
        primary: '#1A2C5B',
        text: '#333333',
        textSecondary: '#666666',
        border: '#e1e5e9',
        headerBg: '#1A2C5B',
        selectedBg: '#e3f2fd',
        highlightBg: '#fff3cd'
    };

    const handleCellPress = (tableIndex, rowIndex, colIndex, value) => {
        if (!interactive) return;

        const cellKey = `${tableIndex}_${rowIndex}_${colIndex}`;
        const newSelectedCells = new Set(selectedCells);
        
        if (newSelectedCells.has(cellKey)) {
            newSelectedCells.delete(cellKey);
        } else {
            newSelectedCells.add(cellKey);
        }
        
        setSelectedCells(newSelectedCells);
        
        if (onInteraction) {
            onInteraction({
                type: 'cell_selection',
                table: tableIndex,
                row: rowIndex,
                col: colIndex,
                value: value,
                selected: newSelectedCells.has(cellKey),
                totalSelected: newSelectedCells.size
            });
        }
    };

    const handleRowPress = (tableIndex, rowIndex) => {
        if (!interactive) return;

        const rowKey = `${tableIndex}_${rowIndex}`;
        const newHighlightedRows = new Set(highlightedRows);
        
        if (newHighlightedRows.has(rowKey)) {
            newHighlightedRows.delete(rowKey);
        } else {
            newHighlightedRows.add(rowKey);
        }
        
        setHighlightedRows(newHighlightedRows);
        
        if (onInteraction) {
            onInteraction({
                type: 'row_selection',
                table: tableIndex,
                row: rowIndex,
                selected: newHighlightedRows.has(rowKey)
            });
        }
    };

    const renderPrimaryKeys = (table) => {
        if (!table.primaryKeys || table.primaryKeys.length === 0) return null;

        return (
            <View style={styles.keysContainer}>
                <Text style={[styles.keysLabel, { color: colors.textSecondary }]}>
                    🔑 Primary Key(s): {table.primaryKeys.join(', ')}
                </Text>
            </View>
        );
    };

    const renderForeignKeys = (table) => {
        if (!table.foreignKeys || table.foreignKeys.length === 0) return null;

        return (
            <View style={styles.keysContainer}>
                {table.foreignKeys.map((fk, index) => (
                    <Text key={index} style={[styles.keysLabel, { color: colors.textSecondary }]}>
                        🔗 {fk.column} → {fk.references.table}.{fk.references.column}
                    </Text>
                ))}
            </View>
        );
    };

    const renderColumnTypes = (table) => {
        if (!table.columnTypes) return null;

        return (
            <View style={styles.columnTypesContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Column Types:</Text>
                <View style={styles.columnTypesList}>
                    {Object.entries(table.columnTypes).map(([column, type]) => (
                        <View key={column} style={[styles.columnTypeItem, { borderColor: colors.border }]}>
                            <Text style={[styles.columnName, { color: colors.primary }]}>
                                {column}
                            </Text>
                            <Text style={[styles.columnType, { color: colors.textSecondary }]}>
                                {type}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderTable = (table, tableIndex) => {
        const { name, headers, rows, description, constraints } = table;

        return (
            <View key={tableIndex} style={[styles.tableContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableName, { color: colors.primary }]}>
                        📊 {name}
                    </Text>
                    {description && (
                        <Text style={[styles.tableDescription, { color: colors.textSecondary }]}>
                            {description}
                        </Text>
                    )}
                </View>

                {renderPrimaryKeys(table)}
                {renderForeignKeys(table)}
                {renderColumnTypes(table)}

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={[styles.table, { borderColor: colors.border }]}>
                        {/* Header Row */}
                        <View style={styles.tableRow}>
                            {interactive && (
                                <View style={[styles.rowSelectorHeader, { backgroundColor: colors.headerBg }]}>
                                    <FontAwesome5 name="mouse-pointer" size={12} color="#ffffff" />
                                </View>
                            )}
                            {headers.map((header, colIndex) => {
                                const isPrimaryKey = table.primaryKeys?.includes(header);
                                const isForeignKey = table.foreignKeys?.some(fk => fk.column === header);
                                
                                return (
                                    <View key={colIndex} style={[styles.headerCell, { backgroundColor: colors.headerBg }]}>
                                        <View style={styles.headerContent}>
                                            <Text style={styles.headerText}>{header}</Text>
                                            {isPrimaryKey && <FontAwesome5 name="key" size={10} color="#FFD700" />}
                                            {isForeignKey && <FontAwesome5 name="link" size={10} color="#87CEEB" />}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Data Rows */}
                        {rows.map((row, rowIndex) => {
                            const rowKey = `${tableIndex}_${rowIndex}`;
                            const isRowHighlighted = highlightedRows.has(rowKey);
                            
                            return (
                                <View 
                                    key={rowIndex} 
                                    style={[
                                        styles.tableRow,
                                        isRowHighlighted && { backgroundColor: colors.highlightBg }
                                    ]}
                                >
                                    {interactive && (
                                        <TouchableOpacity
                                            style={[
                                                styles.rowSelector,
                                                { backgroundColor: colors.surface },
                                                isRowHighlighted && { backgroundColor: colors.selectedBg }
                                            ]}
                                            onPress={() => handleRowPress(tableIndex, rowIndex)}
                                        >
                                            <Text style={[styles.rowNumber, { color: colors.textSecondary }]}>
                                                {rowIndex + 1}
                                            </Text>
                                            {isRowHighlighted && (
                                                <FontAwesome5 name="check" size={10} color={colors.primary} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    {row.map((cell, colIndex) => {
                                        const cellKey = `${tableIndex}_${rowIndex}_${colIndex}`;
                                        const isCellSelected = selectedCells.has(cellKey);
                                        
                                        return (
                                            <TouchableOpacity
                                                key={colIndex}
                                                style={[
                                                    styles.dataCell,
                                                    { 
                                                        backgroundColor: colors.background,
                                                        borderColor: colors.border 
                                                    },
                                                    isCellSelected && { backgroundColor: colors.selectedBg }
                                                ]}
                                                onPress={() => handleCellPress(tableIndex, rowIndex, colIndex, cell)}
                                                disabled={!interactive}
                                            >
                                                <Text style={[
                                                    styles.cellText,
                                                    { color: colors.text },
                                                    cell === null && styles.nullText
                                                ]}>
                                                    {cell === null ? 'NULL' : String(cell)}
                                                </Text>
                                                {isCellSelected && interactive && (
                                                    <FontAwesome5 
                                                        name="check-circle" 
                                                        size={12} 
                                                        color={colors.primary}
                                                        style={styles.selectedIcon}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>

                {constraints && constraints.length > 0 && (
                    <View style={styles.constraintsContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Constraints:</Text>
                        {constraints.map((constraint, index) => (
                            <Text key={index} style={[styles.constraintText, { color: colors.textSecondary }]}>
                                • {constraint}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderQueryInterface = () => {
        if (!interactive) return null;

        return (
            <View style={styles.queryContainer}>
                <TouchableOpacity
                    style={[styles.queryButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowQuery(true)}
                >
                    <FontAwesome5 name="terminal" size={16} color="#ffffff" />
                    <Text style={styles.queryButtonText}>Write SQL Query</Text>
                </TouchableOpacity>

                <Modal
                    visible={showQuery}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowQuery(false)}
                >
                    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                SQL Query Editor
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowQuery(false)}
                                style={styles.closeButton}
                            >
                                <FontAwesome5 name="times" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[
                                styles.queryInput,
                                { 
                                    backgroundColor: colors.surface,
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            multiline
                            placeholder="SELECT * FROM table_name WHERE condition..."
                            placeholderTextColor={colors.textSecondary}
                            value={queryText}
                            onChangeText={setQueryText}
                            autoCapitalize="none"
                            autoCorrect={false}
                            fontFamily="Courier"
                        />

                        <TouchableOpacity
                            style={[styles.executeButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                if (onInteraction) {
                                    onInteraction({
                                        type: 'sql_query',
                                        query: queryText
                                    });
                                }
                                setShowQuery(false);
                                Alert.alert('Query Executed', 'Query has been processed for evaluation.');
                            }}
                        >
                            <FontAwesome5 name="play" size={16} color="#ffffff" />
                            <Text style={styles.executeButtonText}>Execute Query</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>
        );
    };

    if (!tables || tables.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
                <FontAwesome5 name="database" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No database tables to display
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }, style]}>
            {tables.length > 1 && (
                <View style={styles.tableTabs}>
                    {tables.map((table, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.tableTab,
                                selectedTable === index && [styles.activeTableTab, { borderBottomColor: colors.primary }]
                            ]}
                            onPress={() => setSelectedTable(index)}
                        >
                            <Text style={[
                                styles.tableTabText,
                                { color: colors.textSecondary },
                                selectedTable === index && { color: colors.primary }
                            ]}>
                                {table.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                {tables.length === 1 ? 
                    renderTable(tables[0], 0) : 
                    renderTable(tables[selectedTable], selectedTable)
                }
            </ScrollView>

            {renderQueryInterface()}

            {interactive && selectedCells.size > 0 && (
                <View style={[styles.selectionInfo, { backgroundColor: colors.primary }]}>
                    <Text style={styles.selectionText}>
                        {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
                    </Text>
                    <TouchableOpacity 
                        onPress={() => setSelectedCells(new Set())}
                        style={styles.clearSelection}
                    >
                        <FontAwesome5 name="times" size={14} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginVertical: 10
    },
    tableTabs: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa'
    },
    tableTab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTableTab: {
        borderBottomWidth: 2
    },
    tableTabText: {
        fontSize: 14,
        fontWeight: '600'
    },
    tableContainer: {
        padding: 15
    },
    tableHeader: {
        marginBottom: 15
    },
    tableName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 5
    },
    tableDescription: {
        fontSize: 14,
        fontStyle: 'italic'
    },
    keysContainer: {
        marginBottom: 10
    },
    keysLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2
    },
    columnTypesContainer: {
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8
    },
    columnTypesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    columnTypeItem: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center'
    },
    columnName: {
        fontSize: 11,
        fontWeight: '600'
    },
    columnType: {
        fontSize: 10,
        fontStyle: 'italic'
    },
    table: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden'
    },
    tableRow: {
        flexDirection: 'row'
    },
    rowSelectorHeader: {
        width: 40,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rowSelector: {
        width: 40,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1
    },
    rowNumber: {
        fontSize: 11,
        fontWeight: '500'
    },
    headerCell: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        minWidth: 100,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center'
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    headerText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center'
    },
    dataCell: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        minWidth: 100,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    cellText: {
        fontSize: 12,
        textAlign: 'center'
    },
    nullText: {
        fontStyle: 'italic',
        opacity: 0.6
    },
    selectedIcon: {
        position: 'absolute',
        top: 2,
        right: 2
    },
    constraintsContainer: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e1e5e9'
    },
    constraintText: {
        fontSize: 12,
        marginBottom: 2
    },
    queryContainer: {
        padding: 15
    },
    queryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8
    },
    queryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600'
    },
    modalContainer: {
        flex: 1,
        padding: 20
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e5e9'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700'
    },
    closeButton: {
        padding: 5
    },
    queryInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        marginBottom: 20
    },
    executeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 8,
        gap: 10
    },
    executeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
    },
    selectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10
    },
    selectionText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600'
    },
    clearSelection: {
        padding: 5
    },
    emptyContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12
    },
    emptyText: {
        fontSize: 16,
        marginTop: 10
    }
});