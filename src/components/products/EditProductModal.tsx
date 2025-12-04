import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "../../ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, X, Plus, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EditProductModalProps {
    product: any
    isOpen: boolean
    onClose: () => void
    onSave: (productId: number, data: any) => Promise<void>
    categories?: any[]
}

export function EditProductModal({ product, isOpen, onClose, onSave, categories = [] }: EditProductModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("general")

    // Form State
    const [formData, setFormData] = useState<any>({})
    const [selectedCategories, setSelectedCategories] = useState<number[]>([])
    const [images, setImages] = useState<any[]>([])
    const [newImageUrl, setNewImageUrl] = useState("")

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                slug: product.slug || "",
                status: product.status || "publish",
                description: product.description?.replace(/<[^>]*>/g, '') || "", // Strip HTML for simple editing
                short_description: product.short_description?.replace(/<[^>]*>/g, '') || "",
                regular_price: product.regular_price || "",
                sale_price: product.sale_price || "",
                sku: product.sku || "",
                manage_stock: product.manage_stock || false,
                stock_quantity: product.stock_quantity || 0,
                stock_status: product.stock_status || "instock",
                weight: product.weight || "",
                length: product.dimensions?.length || "",
                width: product.dimensions?.width || "",
                height: product.dimensions?.height || "",
            })
            setSelectedCategories(product.categories?.map((c: any) => c.id) || [])
            setImages(product.images || [])
        }
    }, [product])

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleAddImage = () => {
        if (newImageUrl) {
            setImages(prev => [...prev, { src: newImageUrl, name: "New Image" }])
            setNewImageUrl("")
        }
    }

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const payload = {
                ...formData,
                categories: selectedCategories.map(id => ({ id })),
                images: images.map(img => img.id ? { id: img.id } : { src: img.src })
            }

            // Clean up empty values
            if (payload.sale_price === "") payload.sale_price = ""

            await onSave(product.id, payload)
            onClose()
        } catch (error) {
            console.error("Failed to save product", error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!product) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Produto: {product.name}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="general">Geral</TabsTrigger>
                        <TabsTrigger value="inventory">Estoque</TabsTrigger>
                        <TabsTrigger value="shipping">Entrega</TabsTrigger>
                        <TabsTrigger value="images">Imagens</TabsTrigger>
                        <TabsTrigger value="categories">Categorias</TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name">Nome do Produto</Label>
                                <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input id="slug" value={formData.slug} onChange={(e) => handleChange("slug", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="publish">Publicado</SelectItem>
                                        <SelectItem value="draft">Rascunho</SelectItem>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="private">Privado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="regular_price">Preço Regular (R$)</Label>
                                <Input id="regular_price" type="number" step="0.01" value={formData.regular_price} onChange={(e) => handleChange("regular_price", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sale_price">Preço Promocional (R$)</Label>
                                <Input id="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={(e) => handleChange("sale_price", e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="short_description">Breve Descrição</Label>
                                <Textarea id="short_description" rows={3} value={formData.short_description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("short_description", e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description">Descrição Completa</Label>
                                <Textarea id="description" rows={5} value={formData.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Inventory Tab */}
                    <TabsContent value="inventory" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input id="sku" value={formData.sku} onChange={(e) => handleChange("sku", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock_status">Status do Estoque</Label>
                                <Select value={formData.stock_status} onValueChange={(v) => handleChange("stock_status", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instock">Em Estoque</SelectItem>
                                        <SelectItem value="outofstock">Fora de Estoque</SelectItem>
                                        <SelectItem value="onbackorder">Sob Encomenda</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 col-span-2">
                                <input
                                    type="checkbox"
                                    id="manage_stock"
                                    checked={formData.manage_stock}
                                    onChange={(e) => handleChange("manage_stock", e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="manage_stock">Gerenciar estoque?</Label>
                            </div>
                            {formData.manage_stock && (
                                <div className="space-y-2">
                                    <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                                    <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={(e) => handleChange("stock_quantity", parseInt(e.target.value))} />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Shipping Tab */}
                    <TabsContent value="shipping" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight">Peso (kg)</Label>
                                <Input id="weight" value={formData.weight} onChange={(e) => handleChange("weight", e.target.value)} />
                            </div>
                            <div className="col-span-2 grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="length">Comprimento (cm)</Label>
                                    <Input id="length" value={formData.length} onChange={(e) => handleChange("length", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="width">Largura (cm)</Label>
                                    <Input id="width" value={formData.width} onChange={(e) => handleChange("width", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Altura (cm)</Label>
                                    <Input id="height" value={formData.height} onChange={(e) => handleChange("height", e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Images Tab */}
                    <TabsContent value="images" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="URL da imagem (https://...)"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                />
                                <Button onClick={handleAddImage} type="button" variant="secondary">
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group border rounded-md overflow-hidden aspect-square">
                                        <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                Imagem Destacada
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {images.length === 0 && (
                                    <div className="col-span-3 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mb-2" />
                                        <p>Nenhuma imagem</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Categories Tab */}
                    <TabsContent value="categories" className="space-y-4 py-4">
                        <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
                            {categories.length > 0 ? categories.map((cat: any) => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`cat-${cat.id}`}
                                        checked={selectedCategories.includes(cat.id)}
                                        onChange={() => handleCategoryToggle(cat.id)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor={`cat-${cat.id}`}>{cat.name}</Label>
                                </div>
                            )) : (
                                <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

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
