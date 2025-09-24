"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface PortfolioUploaderProps {
  className?: string
  onUpload?: (file: File) => Promise<void>
  accept?: string[]
  maxSizeMB?: number
}

export function PortfolioUploader({
  className,
  onUpload,
  accept = ['.xlsx', '.xls', '.csv'],
  maxSizeMB = 10,
}: PortfolioUploaderProps) {
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)

  const handleUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setUploadedFile(file)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      // Simulação de progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onUpload?.(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao fazer upload do arquivo')
      setUploadProgress(0)
    }
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: uploadStatus === 'uploading',
  })

  const reset = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
    setUploadedFile(null)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          uploadStatus === 'uploading' && "cursor-not-allowed opacity-60",
          uploadStatus === 'success' && "border-green-500 bg-green-50",
          uploadStatus === 'error' && "border-destructive bg-destructive/5",
          uploadStatus === 'idle' && "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'idle' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {isDragActive ? 'Solte o arquivo aqui' : 'Envie sua carteira atual'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Arraste e solte ou clique para selecionar um arquivo Excel (.xlsx, .xls) ou CSV
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}

        {uploadStatus === 'uploading' && uploadedFile && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileSpreadsheet className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Processando carteira...</h3>
              <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
              <Progress value={uploadProgress} className="mt-3 h-2" />
            </div>
          </div>
        )}

        {uploadStatus === 'success' && uploadedFile && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-700">Carteira carregada com sucesso!</h3>
              <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Carregar nova carteira
              </Button>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-destructive">Erro no upload</h3>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {fileRejections.length > 0 && (
          <div className="absolute top-2 right-2">
            <div className="bg-destructive/10 text-destructive text-xs px-2 py-1 rounded">
              Arquivo inválido
            </div>
          </div>
        )}
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-2 text-sm text-destructive">
          {fileRejections[0].errors[0].message}
        </div>
      )}
    </div>
  )
}