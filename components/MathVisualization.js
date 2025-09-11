import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanGestureHandler,
  State,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import Svg, {
  Line,
  Circle,
  Rectangle,
  Polygon,
  Text as SvgText,
  Path,
  Defs,
  LinearGradient,
  Stop
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BookLoadingAnimation } from '../components/BookLoadingAnimation';
import { Colors } from '../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MathVisualization({ 
  type, 
  data, 
  interactive = false, 
  onInteraction,
  style 
}) {
  const [animatedValues, setAnimatedValues] = useState({});
  const [interactivePoints, setInteractivePoints] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const svgRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    initializeVisualization();
    if (data.animated) {
      startAnimation();
    }
  }, [type, data]);

  const initializeVisualization = () => {
    const values = {};
    
    if (type === 'graph' && data.points) {
      data.points.forEach((point, index) => {
        values[`point_${index}`] = new Animated.Value(0);
      });
    }
    
    if (type === 'geometry' && data.shapes) {
      data.shapes.forEach((shape, index) => {
        values[`shape_${index}`] = new Animated.Value(0);
      });
    }
    
    values.opacity = new Animated.Value(0);
    values.scale = new Animated.Value(0.8);
    
    setAnimatedValues(values);
  };

  const startAnimation = () => {
    if (!data.animated) return;

    const animations = [
      Animated.timing(animatedValues.opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(animatedValues.scale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      })
    ];

    if (data.animationSteps) {
      data.animationSteps.forEach((step, index) => {
        animations.push(
          Animated.timing(animatedValues[step.target], {
            toValue: step.value,
            duration: step.duration || 1000,
            delay: (index + 1) * 500,
            useNativeDriver: false
          })
        );
      });
    }

    Animated.sequence(animations).start();
  };

  const handlePanGesture = (event) => {
    if (!interactive) return;

    const { x, y } = event.nativeEvent;
    const newPoint = { x, y };
    
    setInteractivePoints([...interactivePoints, newPoint]);
    onInteraction?.({ type: 'point_added', point: newPoint });
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const { width = 300, height = 300 } = data.dimensions || {};
    const gridLines = [];
    const spacing = 20;

    for (let i = 0; i <= width; i += spacing) {
      gridLines.push(
        <Line
          key={`v_${i}`}
          x1={i}
          y1={0}
          x2={i}
          y2={height}
          stroke="#e1e5e9"
          strokeWidth="0.5"
        />
      );
    }

    for (let j = 0; j <= height; j += spacing) {
      gridLines.push(
        <Line
          key={`h_${j}`}
          x1={0}
          y1={j}
          x2={width}
          y2={j}
          stroke="#e1e5e9"
          strokeWidth="0.5"
        />
      );
    }

    return <>{gridLines}</>;
  };

  const renderAxes = () => {
    const { width = 300, height = 300, centerX = 150, centerY = 150 } = data.dimensions || {};
    
    return (
      <>
        <Line
          x1={0}
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <Line
          x1={centerX}
          y1={height}
          x2={centerX}
          y2={0}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        {showLabels && (
          <>
            <SvgText x={width - 10} y={centerY - 5} fontSize="12" fill="#666">
              x
            </SvgText>
            <SvgText x={centerX + 5} y={15} fontSize="12" fill="#666">
              y
            </SvgText>
          </>
        )}
      </>
    );
  };

  const renderLinearEquation = () => {
    if (!data.equation) return null;

    const { a, b, c } = data.equation; // ax + by = c
    const { width = 300, height = 300, centerX = 150, centerY = 150 } = data.dimensions || {};
    
    const x1 = -centerX;
    const y1 = (c - a * x1) / b;
    const x2 = width - centerX;
    const y2 = (c - a * x2) / b;

    const screenX1 = x1 + centerX;
    const screenY1 = centerY - y1;
    const screenX2 = x2 + centerX;
    const screenY2 = centerY - y2;

    return (
      <Line
        x1={screenX1}
        y1={screenY1}
        x2={screenX2}
        y2={screenY2}
        stroke="#007AFF"
        strokeWidth="3"
      />
    );
  };

  const renderQuadraticFunction = () => {
    if (!data.equation) return null;

    const { a, b, c } = data.equation; // y = ax² + bx + c
    const { width = 300, height = 300, centerX = 150, centerY = 150 } = data.dimensions || {};
    
    const points = [];
    const step = 0.5;
    
    for (let x = -centerX / 10; x <= (width - centerX) / 10; x += step) {
      const y = a * x * x + b * x + c;
      const screenX = x * 10 + centerX;
      const screenY = centerY - y * 10;
      
      if (screenY >= 0 && screenY <= height) {
        points.push(`${screenX},${screenY}`);
      }
    }

    const pathData = `M ${points.join(' L ')}`;
    
    return (
      <Path
        d={pathData}
        stroke="#ff6b6b"
        strokeWidth="3"
        fill="none"
      />
    );
  };

  const renderGeometricShape = (shape, index) => {
    const { type: shapeType, properties, color = '#34c759' } = shape;
    
    switch (shapeType) {
      case 'circle':
        return (
          <Circle
            key={index}
            cx={properties.cx}
            cy={properties.cy}
            r={properties.r}
            fill={color}
            fillOpacity="0.3"
            stroke={color}
            strokeWidth="2"
          />
        );
      
      case 'rectangle':
        return (
          <Rectangle
            key={index}
            x={properties.x}
            y={properties.y}
            width={properties.width}
            height={properties.height}
            fill={color}
            fillOpacity="0.3"
            stroke={color}
            strokeWidth="2"
          />
        );
      
      case 'triangle':
        const trianglePoints = properties.points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <Polygon
            key={index}
            points={trianglePoints}
            fill={color}
            fillOpacity="0.3"
            stroke={color}
            strokeWidth="2"
          />
        );
      
      default:
        return null;
    }
  };

  const renderLabels = () => {
    if (!showLabels || !data.labels) return null;

    return data.labels.map((label, index) => (
      <SvgText
        key={index}
        x={label.x}
        y={label.y}
        fontSize="12"
        fill="#333"
        textAnchor="middle"
        fontWeight="bold"
      >
        {label.text}
      </SvgText>
    ));
  };

  const renderInteractivePoints = () => {
    return interactivePoints.map((point, index) => (
      <Circle
        key={`interactive_${index}`}
        cx={point.x}
        cy={point.y}
        r="6"
        fill="#ffa726"
        stroke="#ff8f00"
        strokeWidth="2"
      />
    ));
  };

  const renderStepByStepConstruction = () => {
    if (!data.steps || currentStep >= data.steps.length) return null;

    const step = data.steps[currentStep];
    const elements = [];

    step.elements?.forEach((element, index) => {
      switch (element.type) {
        case 'point':
          elements.push(
            <Circle
              key={`step_point_${index}`}
              cx={element.x}
              cy={element.y}
              r="4"
              fill="#007AFF"
            />
          );
          break;
        
        case 'line':
          elements.push(
            <Line
              key={`step_line_${index}`}
              x1={element.x1}
              y1={element.y1}
              x2={element.x2}
              y2={element.y2}
              stroke="#007AFF"
              strokeWidth="2"
              strokeDasharray={element.dashed ? "5,5" : "0"}
            />
          );
          break;
        
        case 'arc':
          const { cx, cy, r, startAngle, endAngle } = element;
          const startX = cx + r * Math.cos(startAngle);
          const startY = cy + r * Math.sin(startAngle);
          const endX = cx + r * Math.cos(endAngle);
          const endY = cy + r * Math.sin(endAngle);
          
          elements.push(
            <Path
              key={`step_arc_${index}`}
              d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
              stroke="#007AFF"
              strokeWidth="2"
              fill="none"
            />
          );
          break;
      }
    });

    return elements;
  };

  const renderVisualization = () => {
    const { width = 300, height = 300 } = data.dimensions || {};
    
    return (
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#007AFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#34c759" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        
        {showGrid && renderGrid()}
        
        {(type === 'graph' || type === 'coordinate') && renderAxes()}
        
        {type === 'linear_equation' && renderLinearEquation()}
        {type === 'quadratic_function' && renderQuadraticFunction()}
        
        {type === 'geometry' && data.shapes?.map((shape, index) => 
          renderGeometricShape(shape, index)
        )}
        
        {data.steps && renderStepByStepConstruction()}
        
        {renderLabels()}
        {interactive && renderInteractivePoints()}
      </Svg>
    );
  };

  const renderControls = () => {
    if (!interactive && !data.steps) return null;

    return (
      <View style={styles.controls}>
        {data.steps && (
          <View style={styles.stepControls}>
            <TouchableOpacity
              style={[styles.controlButton, currentStep === 0 && styles.controlButtonDisabled]}
              onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <Ionicons name="play-back" size={16} color={currentStep === 0 ? '#ccc' : '#007AFF'} />
            </TouchableOpacity>
            
            <Text style={styles.stepText}>
              Step {currentStep + 1} of {data.steps.length}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.controlButton, 
                currentStep >= data.steps.length - 1 && styles.controlButtonDisabled
              ]}
              onPress={() => setCurrentStep(Math.min(data.steps.length - 1, currentStep + 1))}
              disabled={currentStep >= data.steps.length - 1}
            >
              <Ionicons 
                name="play-forward" 
                size={16} 
                color={currentStep >= data.steps.length - 1 ? '#ccc' : '#007AFF'} 
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.toggleControls}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowGrid(!showGrid)}
          >
            <Ionicons 
              name={showGrid ? 'grid' : 'grid-outline'} 
              size={16} 
              color={showGrid ? '#007AFF' : '#666'} 
            />
            <Text style={[styles.toggleText, showGrid && styles.toggleTextActive]}>
              Grid
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowLabels(!showLabels)}
          >
            <Ionicons 
              name={showLabels ? 'pricetag' : 'pricetag-outline'} 
              size={16} 
              color={showLabels ? '#007AFF' : '#666'} 
            />
            <Text style={[styles.toggleText, showLabels && styles.toggleTextActive]}>
              Labels
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!data || Object.keys(animatedValues).length === 0) {
    return (
      <BookLoadingAnimation 
        size={120}
        style={styles.loadingContainer}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {data.title && (
        <Text style={styles.title}>{data.title}</Text>
      )}
      
      <Animated.View
        style={[
          styles.visualizationContainer,
          {
            opacity: animatedValues.opacity,
            transform: [{ scale: animatedValues.scale }]
          }
        ]}
      >
        <PanGestureHandler
          onGestureEvent={handlePanGesture}
          onHandlerStateChange={handlePanGesture}
          enabled={interactive}
        >
          <View style={styles.svgContainer}>
            {renderVisualization()}
          </View>
        </PanGestureHandler>
      </Animated.View>

      {renderControls()}

      {data.description && (
        <Text style={styles.description}>{data.description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15
  },
  visualizationContainer: {
    alignItems: 'center',
    marginBottom: 15
  },
  svgContainer: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  svg: {
    backgroundColor: '#fafafa',
    borderRadius: 8
  },
  controls: {
    marginTop: 10
  },
  stepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  controlButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0'
  },
  controlButtonDisabled: {
    opacity: 0.5
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 15,
    fontWeight: '500'
  },
  toggleControls: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: '#f8f9fa'
  },
  toggleText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  toggleTextActive: {
    color: '#007AFF',
    fontWeight: '500'
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10
  }
});