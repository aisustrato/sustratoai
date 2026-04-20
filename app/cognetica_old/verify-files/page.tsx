"use client";

import { useState } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { Search, CheckCircle, XCircle, AlertTriangle, FileText, FileJson, FileCode } from "lucide-react";

interface FileVerification {
    filename: string;
    hash: string | null;
    semillas_count: number | null;
    pensadores_count: number | null;
    disciplinas_count: number | null;
    transcripcion_length: number | null;
    error: string | null;
}

interface VerificationResult {
    verificacion_exitosa: boolean;
    hashes_consistentes: boolean;
    conteos_consistentes: boolean;
    hash_unico: string | null;
    archivos: FileVerification[];
    resumen: {
        total_archivos: number;
        archivos_validos: number;
        archivos_con_error: number;
        mensaje: string;
    };
    mensaje: string;
}

export default function VerifyFilesPage() {
    const [mdFile, setMdFile] = useState<File | null>(null);
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [yamlFile, setYamlFile] = useState<File | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (type: 'md' | 'json' | 'yaml', file: File | null) => {
        if (type === 'md') setMdFile(file);
        if (type === 'json') setJsonFile(file);
        if (type === 'yaml') setYamlFile(file);
        
        // Reset results when files change
        setResult(null);
        setError(null);
    };

    const handleVerify = async () => {
        if (!mdFile || !jsonFile || !yamlFile) {
            setError("Por favor selecciona los 3 archivos");
            return;
        }

        setIsVerifying(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('md', mdFile);
            formData.append('json', jsonFile);
            formData.append('yaml', yamlFile);

            const response = await fetch('/api/cognetica_old/verify-files', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error verificando archivos');
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsVerifying(false);
        }
    };

    const allFilesSelected = mdFile && jsonFile && yamlFile;

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <StandardPageTitle
                title="Verificación Exhaustiva de Archivos"
                subtitle="Verifica la consistencia entre archivos MD, JSON y YAML exportados"
            />

            <div className="space-y-6 mt-8">
                {/* File Upload Section */}
                <StandardCard shimmer elevate>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* MD File */}
                            <FileUploadBox
                                icon={<FileText className="w-8 h-8" />}
                                label="Archivo Markdown (.md)"
                                accept=".md"
                                file={mdFile}
                                onChange={(file) => handleFileChange('md', file)}
                                colorClass="text-blue-600"
                            />

                            {/* JSON File */}
                            <FileUploadBox
                                icon={<FileJson className="w-8 h-8" />}
                                label="Archivo JSON (.json)"
                                accept=".json"
                                file={jsonFile}
                                onChange={(file) => handleFileChange('json', file)}
                                colorClass="text-green-600"
                            />

                            {/* YAML File */}
                            <FileUploadBox
                                icon={<FileCode className="w-8 h-8" />}
                                label="Archivo YAML (.yaml/.yml)"
                                accept=".yaml,.yml"
                                file={yamlFile}
                                onChange={(file) => handleFileChange('yaml', file)}
                                colorClass="text-purple-600"
                            />
                        </div>

                        <div className="flex justify-center pt-4">
                            <StandardButton
                                onClick={handleVerify}
                                disabled={!allFilesSelected || isVerifying}
                                colorScheme={allFilesSelected ? "primary" : "neutral"}
                                size="lg"
                                leftIcon={isVerifying ? undefined : Search}
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                        Verificando...
                                    </>
                                ) : (
                                    "Verificar Consistencia"
                                )}
                            </StandardButton>
                        </div>
                    </div>
                </StandardCard>

                {/* Error Display */}
                {error && (
                    <StandardCard colorScheme="danger">
                        <div className="p-4 flex items-start gap-3">
                            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Error</h3>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </StandardCard>
                )}

                {/* Results Display */}
                {result && (
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <StandardCard colorScheme={result.verificacion_exitosa ? "success" : "warning"} pulseBorder>
                            <div className="p-6">
                                <div className="flex items-start gap-3">
                                    {result.verificacion_exitosa ? (
                                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                                    ) : (
                                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">
                                            {result.mensaje.replace('paranoica', 'exhaustiva')}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <StatBox
                                                label="Archivos Válidos"
                                                value={`${result.resumen.archivos_validos}/${result.resumen.total_archivos}`}
                                                success={result.resumen.archivos_validos === result.resumen.total_archivos}
                                            />
                                            <StatBox
                                                label="Hashes"
                                                value={result.hashes_consistentes ? "Consistentes" : "Inconsistentes"}
                                                success={result.hashes_consistentes}
                                            />
                                            <StatBox
                                                label="Conteos"
                                                value={result.conteos_consistentes ? "Consistentes" : "Inconsistentes"}
                                                success={result.conteos_consistentes}
                                            />
                                            <StatBox
                                                label="Errores"
                                                value={result.resumen.archivos_con_error.toString()}
                                                success={result.resumen.archivos_con_error === 0}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {result.hash_unico && (
                                    <div className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-lg">
                                        <p className="text-xs font-semibold mb-1">Hash Único Verificado:</p>
                                        <code className="text-xs break-all">{result.hash_unico}</code>
                                    </div>
                                )}
                            </div>
                        </StandardCard>

                        {/* Individual File Results */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {result.archivos.map((archivo, idx) => (
                                <FileResultCard key={idx} archivo={archivo} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// File Upload Box Component
function FileUploadBox({
    icon,
    label,
    accept,
    file,
    onChange,
    colorClass
}: {
    icon: React.ReactNode;
    label: string;
    accept: string;
    file: File | null;
    onChange: (file: File | null) => void;
    colorClass: string;
}) {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        onChange(selectedFile);
    };

    return (
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                id={`file-${label}`}
            />
            <label htmlFor={`file-${label}`} className="cursor-pointer">
                <div className={`${colorClass} mb-3 flex justify-center`}>
                    {icon}
                </div>
                <p className="text-sm font-medium mb-2">{label}</p>
                {file ? (
                    <div className="space-y-2">
                        <p className="text-xs text-green-600 font-semibold">✓ Archivo seleccionado</p>
                        <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                        <StandardButton
                            size="sm"
                            colorScheme="neutral"
                            onClick={(e) => {
                                e.preventDefault();
                                onChange(null);
                            }}
                        >
                            Cambiar
                        </StandardButton>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">Click para seleccionar</p>
                )}
            </label>
        </div>
    );
}

// Stat Box Component
function StatBox({ label, value, success }: { label: string; value: string; success: boolean }) {
    return (
        <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-sm font-semibold ${success ? 'text-green-600' : 'text-red-600'}`}>
                {value}
            </p>
        </div>
    );
}

// File Result Card Component
function FileResultCard({ archivo }: { archivo: FileVerification }) {
    const hasError = archivo.error !== null;
    const extension = archivo.filename.split('.').pop()?.toUpperCase() || '';

    return (
        <StandardCard colorScheme={hasError ? "danger" : "success"}>
            <div className="p-4">
                <div className="flex items-start gap-2 mb-3">
                    {hasError ? (
                        <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                    ) : (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{archivo.filename}</p>
                        <p className="text-xs text-muted-foreground">{extension}</p>
                    </div>
                </div>

                {hasError ? (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                        {archivo.error}
                    </div>
                ) : (
                    <div className="space-y-1 text-xs">
                        {archivo.hash && (
                            <div className="truncate">
                                <span className="font-semibold">Hash:</span>{' '}
                                <code className="text-[10px]">{archivo.hash.slice(0, 20)}...</code>
                            </div>
                        )}
                        {archivo.semillas_count !== null && (
                            <p><span className="font-semibold">Semillas:</span> {archivo.semillas_count}</p>
                        )}
                        {archivo.pensadores_count !== null && (
                            <p><span className="font-semibold">Pensadores:</span> {archivo.pensadores_count}</p>
                        )}
                        {archivo.disciplinas_count !== null && (
                            <p><span className="font-semibold">Disciplinas:</span> {archivo.disciplinas_count}</p>
                        )}
                    </div>
                )}
            </div>
        </StandardCard>
    );
}
