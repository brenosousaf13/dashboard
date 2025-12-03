import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface EditProductModalProps {
    product: any
    isOpen: boolean
    onClose: () => void
    onSave: (productId: number, data: any) => Promise<void>
}

export function EditProductModal({ product, isOpen, onClose, onSave }: EditProductModalProps) {
    const [price, setPrice] = useState("")
    const [regularPrice, setRegularPrice] = useState("")
    const [salePrice, setSalePrice] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (product) {
            setPrice(product.price || "")
            setRegularPrice(product.regular_price || "")
            setSalePrice(product.sale_price || "")
        }
    }, [product])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Only sending regular_price for now as requested, but keeping structure extensible
            await onSave(product.id, {
                regular_price: regularPrice,
                sale_price: salePrice
            })
            onClose()
        } catch (error) {
            console.error("Failed to save product", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Produto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Produto
                        </Label>
                        <div className="col-span-3 font-medium">
                            {product?.name}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="regular-price" className="text-right">
                            Preço Regular
                        </Label>
                        <Input
                            id="regular-price"
                            value={regularPrice}
                            onChange={(e) => setRegularPrice(e.target.value)}
                            className="col-span-3"
                            type="number"
                            step="0.01"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sale-price" className="text-right">
                            Preço Promocional
                        </Label>
                        <Input
                            id="sale-price"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            className="col-span-3"
                            type="number"
                            step="0.01"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
