import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import MathVisualization from './MathVisualization';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import logger from '../utils/logger';


const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 60;

export default function VisualQuestionRenderer({ 
    visualElements = [], 
    style,
    onInteraction 
}) {
    const [activeElement, setActiveElement] = useState(0);
    const [interactionData, setInteractionData] = useState({});

    if (!visualElements || visualElements.length === 0) {
        return null;
    }

    const renderChart = (chartData, index) => {
        const { chart_type, data, title, axes, labels } = chartData;
        
        const chartConfig = {
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#f8f9fa',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(26, 44, 91, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
                borderRadius: 16
            },
            propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#1A2C5B'
            }
        };

        try {
            switch (chart_type) {
                case 'line':
                    const lineData = {
                        labels: data.map(item => item.label || item.x || ''),
                        datasets: [{
                            data: data.map(item => item.value || item.y || 0),
                            color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`,
                            strokeWidth: 2
                        }]
                    };
                    return (
                        <LineChart
                            data={lineData}
                            width={chartWidth}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                        />
                    );

                case 'bar':
                    const barData = {
                        labels: data.map(item => item.label || item.category || ''),
                        datasets: [{
                            data: data.map(item => item.value || item.count || 0)
                        }]
                    };
                    return (
                        <BarChart
                            data={barData}
                            width={chartWidth}
                            height={220}
                            chartConfig={chartConfig}
                            style={styles.chart}
                            verticalLabelRotation={30}
                        />
                    );

                case 'pie':
                    const pieData = data.map((item, idx) => ({
                        name: item.label || item.category || `Item ${idx + 1}`,
                        population: item.value || item.count || 0,
                        color: getColorForIndex(idx),
                        legendFontColor: '#333333',
                        legendFontSize: 12
                    }));
                    return (
                        <PieChart
                            data={pieData}
                            width={chartWidth}
                            height={220}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            style={styles.chart}
                        />
                    );

                default:
                    return (
                        <View style={styles.unsupportedChart}>
                            <FontAwesome5 name="chart-bar" size={40} color="#ccc" />
                            <Text style={styles.unsupportedText}>
                                Chart type "{chart_type}" not yet supported
                            </Text>
                        </View>
                    );
            }
        } catch (error) {
            logger.warn('Chart rendering error:', error);
            return (
                <View style={styles.chartError}>
                    <FontAwesome5 name="exclamation-triangle" size={24} color="#ff6b7a" />
                    <Text style={styles.errorText}>Chart rendering failed</Text>
                </View>
            );
        }
    };

    const renderTable = (tableData, index) => {
        const { headers, rows, title, caption, highlight_cells = [] } = tableData;

        const isCellHighlighted = (rowIndex, colIndex) => {
            return highlight_cells.some(cell => 
                cell.row === rowIndex && cell.col === colIndex
            );
        };

        return (
            <View style={styles.tableContainer}>
                {title && <Text style={styles.tableTitle}>{title}</Text>}
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.table}>
                        {/* Headers */}
                        <View style={styles.tableRow}>
                            {headers.map((header, idx) => (
                                <View key={idx} style={styles.tableHeaderCell}>
                                    <Text style={styles.tableHeaderText}>{header}</Text>
                                </View>
                            ))}
                        </View>
                        
                        {/* Data rows */}
                        {rows.map((row, rowIdx) => (
                            <View key={rowIdx} style={styles.tableRow}>
                                {row.map((cell, colIdx) => (
                                    <TouchableOpacity
                                        key={colIdx}
                                        style={[
                                            styles.tableCell,
                                            isCellHighlighted(rowIdx, colIdx) && styles.highlightedCell
                                        ]}
                                        onPress={() => {
                                            if (onInteraction) {
                                                onInteraction({
                                                    type: 'table_cell_tap',
                                                    row: rowIdx,
                                                    col: colIdx,
                                                    value: cell
                                                });
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.tableCellText,
                                            isCellHighlighted(rowIdx, colIdx) && styles.highlightedText
                                        ]}>
                                            {cell ?? ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
                
                {caption && <Text style={styles.tableCaption}>{caption}</Text>}
            </View>
        );
    };

    const renderMathVisualization = (mathData, index) => {
        return (
            <MathVisualization
                type={mathData.visualization_type}
                data={mathData}
                interactive={mathData.interactive}
                onInteraction={onInteraction}
                style={styles.mathViz}
            />
        );
    };

    const renderDiagram = (diagramData, index) => {
        const { diagram_type, nodes, connections = [] } = diagramData;
        
        return (
            <View style={styles.diagramContainer}>
                <Text style={styles.diagramTitle}>
                    {diagram_type.replace('_', ' ').toUpperCase()} Diagram
                </Text>
                
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.diagramScroll}
                >
                    <View style={styles.diagram}>
                        {nodes.map((node, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.diagramNode,
                                    {
                                        left: node.x || (idx % 3) * 120 + 20,
                                        top: node.y || Math.floor(idx / 3) * 80 + 20,
                                        backgroundColor: node.color || '#1A2C5B'
                                    }
                                ]}
                                onPress={() => {
                                    if (onInteraction) {
                                        onInteraction({
                                            type: 'diagram_node_tap',
                                            node: node,
                                            index: idx
                                        });
                                    }
                                }}
                            >
                                <Text style={styles.diagramNodeText}>
                                    {node.label || node.name || `Node ${idx + 1}`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        
                        {/* Render connections as simple lines - could be enhanced with SVG */}
                        {connections.map((conn, idx) => (
                            <View
                                key={`conn_${idx}`}
                                style={[
                                    styles.diagramConnection,
                                    {
                                        left: Math.min(
                                            nodes[conn.from]?.x || 0,
                                            nodes[conn.to]?.x || 100
                                        ),
                                        top: Math.min(
                                            nodes[conn.from]?.y || 0,
                                            nodes[conn.to]?.y || 50
                                        ),
                                        width: Math.abs(
                                            (nodes[conn.to]?.x || 100) - (nodes[conn.from]?.x || 0)
                                        ),
                                        height: Math.abs(
                                            (nodes[conn.to]?.y || 50) - (nodes[conn.from]?.y || 0)
                                        )
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderVisualElement = (element, index) => {
        const { type, data, description } = element;

        let content;
        switch (type) {
            case 'chart':
                content = renderChart(data, index);
                break;
            case 'table':
                content = renderTable(data, index);
                break;
            case 'math_visualization':
                content = renderMathVisualization(data, index);
                break;
            case 'diagram':
                content = renderDiagram(data, index);
                break;
            default:
                content = (
                    <View style={styles.unsupportedElement}>
                        <FontAwesome5 name="question-circle" size={24} color="#ccc" />
                        <Text style={styles.unsupportedText}>
                            Visual element type "{type}" not supported
                        </Text>
                    </View>
                );
        }

        return (
            <View key={index} style={styles.visualElementContainer}>
                {content}
                {description && (
                    <Text style={styles.visualDescription}>{description}</Text>
                )}
            </View>
        );
    };

    const getColorForIndex = (index) => {
        const colors = [
            '#1A2C5B', '#D4AF37', '#CD7F32', '#4ade80', 
            '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'
        ];
        return colors[index % colors.length];
    };

    return (
        <View style={[styles.container, style]}>
            {visualElements.length > 1 && (
                <View style={styles.elementTabs}>
                    {visualElements.map((element, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.elementTab,
                                activeElement === index && styles.activeElementTab
                            ]}
                            onPress={() => setActiveElement(index)}
                        >
                            <Text style={[
                                styles.elementTabText,
                                activeElement === index && styles.activeElementTabText
                            ]}>
                                {element.type.replace('_', ' ').toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            
            <ScrollView 
                horizontal={visualElements.length > 1}
                pagingEnabled={visualElements.length > 1}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    if (visualElements.length > 1) {
                        const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                        setActiveElement(page);
                    }
                }}
            >
                {visualElements.length > 1 ? (
                    visualElements.map((element, index) => (
                        <View key={index} style={styles.elementPage}>
                            {renderVisualElement(element, index)}
                        </View>
                    ))
                ) : (
                    renderVisualElement(visualElements[0], 0)
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginVertical: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    elementTabs: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 5
    },
    elementTab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeElementTab: {
        borderBottomColor: '#D4AF37'
    },
    elementTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center'
    },
    activeElementTabText: {
        color: '#D4AF37'
    },
    elementPage: {
        width: screenWidth - 40,
        paddingHorizontal: 10
    },
    visualElementContainer: {
        padding: 15
    },
    visualDescription: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 16
    },
    
    // Chart styles
    chart: {
        marginVertical: 8,
        borderRadius: 16
    },
    unsupportedChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginVertical: 10
    },
    unsupportedText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
        textAlign: 'center'
    },
    chartError: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fee',
        borderRadius: 12,
        marginVertical: 10
    },
    errorText: {
        fontSize: 14,
        color: '#ff6b7a',
        marginTop: 8
    },
    
    // Table styles
    tableContainer: {
        marginVertical: 10
    },
    tableTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2C5B',
        textAlign: 'center',
        marginBottom: 10
    },
    table: {
        borderWidth: 1,
        borderColor: '#e1e5e9',
        borderRadius: 8,
        overflow: 'hidden'
    },
    tableRow: {
        flexDirection: 'row'
    },
    tableHeaderCell: {
        backgroundColor: '#1A2C5B',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minWidth: 100,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.2)'
    },
    tableHeaderText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    },
    tableCell: {
        backgroundColor: '#ffffff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        minWidth: 100,
        borderRightWidth: 1,
        borderRightColor: '#e1e5e9',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e5e9'
    },
    highlightedCell: {
        backgroundColor: '#fef3c7'
    },
    tableCellText: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center'
    },
    highlightedText: {
        fontWeight: '600',
        color: '#1A2C5B'
    },
    tableCaption: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8
    },
    
    // Math visualization styles
    mathViz: {
        marginVertical: 10
    },
    
    // Diagram styles
    diagramContainer: {
        marginVertical: 10
    },
    diagramTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A2C5B',
        textAlign: 'center',
        marginBottom: 15
    },
    diagramScroll: {
        maxHeight: 300
    },
    diagram: {
        position: 'relative',
        width: 400,
        height: 250,
        backgroundColor: '#f8f9fa',
        borderRadius: 8
    },
    diagramNode: {
        position: 'absolute',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    diagramNodeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center'
    },
    diagramConnection: {
        position: 'absolute',
        backgroundColor: '#ccc',
        height: 2,
        borderRadius: 1
    },
    
    // Unsupported element styles
    unsupportedElement: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginVertical: 10
    }
});