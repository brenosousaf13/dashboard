import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useData } from "../../context/DataContext"
import { supabase } from "../../lib/supabase"
import { Loader2, Upload } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

interface StoreSettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function StoreSettingsModal({ isOpen, onClose }: StoreSettingsModalProps) {
    const { storeName, logoUrl, updateStoreSettings } = useData()
    const { user } = useAuth()
    const [name, setName] = useState(storeName)
    const [logo, setLogo] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        setError(null)

        if (file) {
            if (file.type !== "image/png") {
                setError("Apenas arquivos PNG são permitidos.")
                return
            }
            if (file.size > 1024 * 1024) { // 1MB
                setError("O arquivo deve ter no máximo 1MB.")
                return
            }

            setLogo(file)
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
        }
    }

    const handleSave = async () => {
        if (!user) return
        setIsLoading(true)
        setError(null)

        try {
            let finalLogoUrl = logoUrl

            if (logo) {
                const fileExt = logo.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(fileName, logo, {
                        upsert: true
                    })

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('logos')
                    .getPublicUrl(fileName)

                finalLogoUrl = publicUrl
            }

            await updateStoreSettings(name, finalLogoUrl)
            onClose()
        } catch (err) {
            console.error("Error saving settings:", err)
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Erro ao salvar alterações.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurações da Loja</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="storeName">Nome da Loja</Label>
                        <Input
                            id="storeName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Minha Loja"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Logo da Loja</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-md border border-dashed flex items-center justify-center overflow-hidden bg-gray-50">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Sem Logo</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Carregar Logo
                                </Button>
                                <span className="text-[10px] text-muted-foreground">
                                    PNG, máx. 1MB.
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
