'use client'

import { useState, useCallback } from 'react';
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone';
import { HexColorPicker } from 'react-colorful';
import Head from 'next/head';

// Define types for our pH data
type pHColor = {
  pH: number;
  color: string;
  description: string;
};

type pHExample = {
  pH: number;
  example: string;
};

// Define accepted file types
const acceptedFileTypes: Accept = {
  'image/*': ['.jpeg', '.jpg', '.png', '.webp']
};

// pH color map with type annotation
const pHColorMap: pHColor[] = [
  { pH: 0, color: '#ff0000', description: 'Strong acid' },
  { pH: 1, color: '#ff3300', description: 'Very strong acid' },
  { pH: 2, color: '#ff6600', description: 'Strong acid' },
  { pH: 3, color: '#ff9900', description: 'Moderate acid' },
  { pH: 4, color: '#ffcc00', description: 'Moderate acid' },
  { pH: 5, color: '#ffff00', description: 'Weak acid' },
  { pH: 6, color: '#ccff00', description: 'Weak acid' },
  { pH: 7, color: '#00ff00', description: 'Neutral' },
  { pH: 8, color: '#00ccff', description: 'Weak base' },
  { pH: 9, color: '#0066ff', description: 'Weak base' },
  { pH: 10, color: '#0000ff', description: 'Moderate base' },
  { pH: 11, color: '#6600cc', description: 'Moderate base' },
  { pH: 12, color: '#990099', description: 'Strong base' },
  { pH: 13, color: '#cc0066', description: 'Very strong base' },
  { pH: 14, color: '#ff0033', description: 'Strong base' },
];

// Common examples for reference
const pHExamples: pHExample[] = [
  { pH: 1, example: 'Stomach acid' },
  { pH: 2, example: 'Lemon juice' },
  { pH: 3, example: 'Vinegar' },
  { pH: 4, example: 'Orange juice' },
  { pH: 5, example: 'Black coffee' },
  { pH: 6, example: 'Urine' },
  { pH: 7, example: 'Pure water' },
  { pH: 8, example: 'Sea water' },
  { pH: 9, example: 'Baking soda' },
  { pH: 10, example: 'Milk of magnesia' },
  { pH: 12, example: 'Household bleach' },
  { pH: 14, example: 'Drain cleaner' },
];

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const [estimatedpH, setEstimatedpH] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [manualColor, setManualColor] = useState<string>('#ffffff');
  const [manualPH, setManualPH] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      console.error('Rejected files:', fileRejections);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        analyzeImage(reader.result as string);
        setActiveTab('upload');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false,
  });

  const analyzeImage = (imageSrc: string) => {
    setIsLoading(true);
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const color = getDominantColor(img);
      setDominantColor(color);
      const pH = calculatePH(color);
      setEstimatedpH(pH);
      setIsLoading(false);
    };
  };

  const getDominantColor = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    const stripWidth = img.width * 0.3;
    const startX = (img.width - stripWidth) / 2;
    const sampleHeight = img.height * 0.8;
    const startY = img.height * 0.1;
    
    const imageData = ctx.getImageData(startX, startY, stripWidth, sampleHeight).data;
    
    let r = 0, g = 0, b = 0;
    let count = 0;
    
    for (let i = 0; i < imageData.length; i += 4) {
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
      count++;
    }
    
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    return rgbToHex(r, g, b);
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const calculatePH = (color: string): number => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Find closest pH color
    let minDistance = Infinity;
    let closestpH = 7;
    
    pHColorMap.forEach(item => {
      const targetR = parseInt(item.color.slice(1, 3), 16);
      const targetG = parseInt(item.color.slice(3, 5), 16);
      const targetB = parseInt(item.color.slice(5, 7), 16);
      
      // Simple color distance calculation
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) + 
        Math.pow(g - targetG, 2) + 
        Math.pow(b - targetB, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestpH = item.pH;
      }
    });
    
    return closestpH;
  };

  const handleManualColorChange = (color: string) => {
    setManualColor(color);
    const pH = calculatePH(color);
    setManualPH(pH);
  };

  const getpHDescription = (pH: number | null): string => {
    if (pH === null) return '';
    return pHColorMap.find(item => item.pH === pH)?.description || '';
  };

  const getpHExample = (pH: number | null): string => {
    if (pH === null) return '';
    return pHExamples.find(item => item.pH === pH)?.example || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Head>
        <title>pH Strip Analyzer</title>
        <meta name="description" content="Analyze pH strips from photos" />
      </Head>
      
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden p-8">
        <h1 className="text-3xl font-semibold text-center text-gray-900 mb-8">pH Strip Analyzer</h1>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('upload')} 
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
              activeTab === 'upload' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Image Analysis
          </button>
          <button 
            onClick={() => setActiveTab('manual')} 
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
              activeTab === 'manual' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manual Color Selection
          </button>
        </div>
        
        {activeTab === 'upload' && (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Image Upload Section */}
            <div>
              <div 
                {...getRootProps()} 
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition duration-300"
              >
                <input {...getInputProps()} />
                {image ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={image} 
                      alt="Uploaded pH strip" 
                      className="max-h-64 mb-4 rounded-xl shadow-sm object-contain"
                    />
                    <p className="text-sm text-gray-500">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 font-medium">Drag & drop a pH strip image here</p>
                    <p className="text-sm text-gray-500 mt-2">or click to select from your device</p>
                  </div>
                )}
              </div>
              
              {isLoading && (
                <div className="mt-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-blue-500 mt-2 font-medium">Analyzing image...</p>
                </div>
              )}
            </div>
            
            {/* Results Section */}
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Analysis Results</h2>
              
              {dominantColor ? (
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center mb-6">
                    <div 
                      className="w-16 h-16 rounded-xl mr-4 border border-gray-200 shadow-sm"
                      style={{ backgroundColor: dominantColor }}
                    ></div>
                    <div>
                      <p className="text-gray-700">Detected color: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{dominantColor}</span></p>
                      <p className="text-2xl font-bold mt-2">
                        pH: <span className="text-blue-600">{estimatedpH}</span>
                        <span className="text-sm font-normal text-gray-600 ml-2">({getpHDescription(estimatedpH)})</span>
                      </p>
                      {getpHExample(estimatedpH) && (
                        <p className="text-sm text-gray-600 mt-1">Similar to: {getpHExample(estimatedpH)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic bg-gray-50 p-6 rounded-xl text-center">
                  {image ? "Couldn't detect pH strip color. Try a clearer image." : "Upload an image to analyze"}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'manual' && (
          <div className="bg-gray-50 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Manual Color Selection</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <HexColorPicker 
                  color={manualColor} 
                  onChange={handleManualColorChange} 
                  className="w-full max-w-xs shadow-sm rounded-lg overflow-hidden" 
                />
                <div className="flex items-center mt-4">
                  <div 
                    className="w-12 h-12 rounded-lg mr-3 border border-gray-200 shadow-sm"
                    style={{ backgroundColor: manualColor }}
                  ></div>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{manualColor}</span>
                </div>
              </div>
              
              <div>
                {manualPH !== null && (
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <p className="text-2xl font-bold">
                      pH: <span className="text-blue-600">{manualPH}</span>
                    </p>
                    <p className="text-gray-600 mt-1">{getpHDescription(manualPH)}</p>
                    {getpHExample(manualPH) && (
                      <p className="text-sm text-gray-600 mt-3">
                        <span className="font-medium">Similar to:</span> {getpHExample(manualPH)}
                      </p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-lg mr-2"
                          style={{ backgroundColor: pHColorMap.find(c => c.pH === manualPH)?.color }}
                        ></div>
                        <span className="text-sm text-gray-600">Closest standard pH color</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* pH Reference Chart - Always visible */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">pH Color Reference Guide</h2>
          
          <div className="overflow-x-auto">
            <div className="inline-flex rounded-xl shadow-sm">
              {pHColorMap.map((item) => (
                <div 
                  key={item.pH} 
                  className={`w-16 text-center py-2 border-t border-b border-r first:border-l first:rounded-l-xl last:rounded-r-xl ${
                    (activeTab === 'upload' && estimatedpH === item.pH) || 
                    (activeTab === 'manual' && manualPH === item.pH) 
                      ? 'ring-2 ring-blue-500 ring-offset-2 z-10 relative' 
                      : ''
                  }`}
                >
                  <div 
                    className="w-10 h-10 mx-auto rounded-lg mb-1 shadow-sm border border-gray-200"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="font-bold text-lg">{item.pH}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* pH Examples Table */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6">
            <h3 className="font-medium mb-4 text-gray-800">Common pH Examples</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pHExamples.map((item) => (
                <div key={item.pH} className="bg-white p-3 rounded-xl shadow-sm">
                  <div className="flex items-center mb-1">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: pHColorMap.find(c => c.pH === item.pH)?.color }}
                    ></div>
                    <span className="font-semibold">pH {item.pH}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p className="max-w-md mx-auto">Note: This tool provides an estimation only. For scientific or health-related applications, please use calibrated pH meters.</p>
      </div>
    </div>
  );
}