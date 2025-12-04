import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "../ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, X, Plus, Image as ImageIcon, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/context/DataContext"

interface EditProductModalProps {
    product: any
    isOpen: boolean
    onClose: () => void
    onSave: (productId: number, data: any) => Promise<void>
    categories?: any[]
}

export function EditProductModal({ product, isOpen, onClose, onSave, categories = [] }: EditProductModalProps) {
    const { uploadImage } = useData()
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("general")

    // Form State
    const [formData, setFormData] = useState<any>({})
    const [selectedCategories, setSelectedCategories] = useState<number[]>([])

    // Image State
    const [featuredImage, setFeaturedImage] = useState<any>(null)
    const [galleryImages, setGalleryImages] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)

    // Refs for file inputs
    const featuredInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

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

            // Handle images
            const allImages = product.images || []
            if (allImages.length > 0) {
                setFeaturedImage(allImages[0])
                setGalleryImages(allImages.slice(1))
            } else {
                setFeaturedImage(null)
                setGalleryImages([])
            }
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isFeatured: boolean) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const uploaded = await uploadImage(file)
            const newImage = {
                id: uploaded.id,
                src: uploaded.source_url,
                name: uploaded.title.raw
            }

            if (isFeatured) {
                // If there was a featured image, move it to gallery? No, usually replace.
                // Or if user wants to swap, they can drag/drop (not implemented yet).
                // For now, replace featured image.
                setFeaturedImage(newImage)
            } else {
                setGalleryImages(prev => [...prev, newImage])
            }
        } catch (error) {
            console.error("Failed to upload image", error)
            // Ideally show toast error here
        } finally {
            setIsUploading(false)
            // Reset input
            if (e.target) e.target.value = ''
        }
    }

    const handleRemoveGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleRemoveFeaturedImage = () => {
        setFeaturedImage(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Reconstruct images array: Featured first, then gallery
            const allImages = []
            if (featuredImage) allImages.push(featuredImage)
            allImages.push(...galleryImages)

            const payload = {
                ...formData,
                categories: selectedCategories.map(id => ({ id })),
                images: allImages.map(img => img.id ? { id: img.id } : { src: img.src })
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
            <DialogContent className="sm:max-w-[1100px] h-[90vh] flex flex-col p-0 gap-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <DialogTitle className="text-xl">Editar produto</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Atualizar
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left Column: Content */}
                        <div className="col-span-2 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base font-semibold">Título do produto</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base font-semibold">Descrição do produto</Label>
                                    <Textarea
                                        id="description"
                                        rows={8}
                                        value={formData.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
                                        className="resize-none"
                                    />
                                </div>
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full border rounded-lg p-4">
                                <TabsList className="grid w-full grid-cols-5 mb-4">
                                    <TabsTrigger value="general">Geral</TabsTrigger>
                                    <TabsTrigger value="inventory">Estoque</TabsTrigger>
                                    <TabsTrigger value="shipping">Entrega</TabsTrigger>
                                    <TabsTrigger value="attributes">Atributos</TabsTrigger>
                                    <TabsTrigger value="variations">Variações</TabsTrigger>
                                </TabsList>

                                {/* General Tab */}
                                <TabsContent value="general" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="regular_price">Preço (R$)</Label>
                                            <Input id="regular_price" type="number" step="0.01" value={formData.regular_price} onChange={(e) => handleChange("regular_price", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sale_price">Preço promocional (R$)</Label>
                                            <Input id="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={(e) => handleChange("sale_price", e.target.value)} />
                                        </div>
                                        <div className="space-y-2 col-span-2">
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
                                    </div>
                                </TabsContent>

                                {/* Inventory Tab */}
                                <TabsContent value="inventory" className="space-y-4">
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
                                <TabsContent value="shipping" className="space-y-4">
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

                                <TabsContent value="attributes">
                                    <div className="text-center py-8 text-muted-foreground">
                                        Gerenciamento de atributos em breve.
                                    </div>
                                </TabsContent>

                                <TabsContent value="variations">
                                    <div className="text-center py-8 text-muted-foreground">
                                        Gerenciamento de variações em breve.
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Short Description */}
                            <div className="space-y-2 border rounded-lg p-4">
                                <Label htmlFor="short_description" className="font-semibold">Breve Descrição</Label>
                                <Textarea
                                    id="short_description"
                                    rows={3}
                                    value={formData.short_description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("short_description", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Right Column: Images & Categories */}
                        <div className="space-y-6">
                            {/* Featured Image */}
                            <div className="border rounded-lg p-4 bg-card">
                                <Label className="text-base font-semibold mb-4 block">Imagem do produto</Label>
                                <div
                                    className="aspect-[3/4] relative border-2 border-dashed rounded-lg overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer flex flex-col items-center justify-center"
                                    onClick={() => featuredInputRef.current?.click()}
                                >
                                    {featuredImage ? (
                                        <>
                                            <img src={featuredImage.src} alt="Featured" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                                                Alterar imagem
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4 text-muted-foreground">
                                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <span className="text-sm">Definir imagem do produto</span>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={featuredInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, true)}
                                />
                                {featuredImage && (
                                    <Button
                                        variant="link"
                                        className="w-full mt-2 text-red-500 h-auto p-0"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFeaturedImage(); }}
                                    >
                                        Remover imagem do produto
                                    </Button>
                                )}
                            </div>

                            {/* Gallery */}
                            <div className="border rounded-lg p-4 bg-card">
                                <div className="flex items-center justify-between mb-4">
                                    <Label className="text-base font-semibold">Galeria de imagens</Label>
                                    <Button variant="ghost" size="sm" onClick={() => galleryInputRef.current?.click()}>
                                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {galleryImages.map((img, index) => (
                                        <div key={index} className="relative aspect-square border rounded overflow-hidden group">
                                            <img src={img.src} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemoveGalleryImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        className="aspect-square border-2 border-dashed rounded flex items-center justify-center hover:bg-accent/50 transition-colors"
                                        onClick={() => galleryInputRef.current?.click()}
                                    >
                                        <Plus className="w-6 h-6 text-muted-foreground" />
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={galleryInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, false)}
                                />
                            </div>

                            {/* Categories */}
                            <div className="border rounded-lg p-4 bg-card">
                                <Label className="text-base font-semibold mb-4 block">Categorias</Label>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded p-2">
                                    {categories.length > 0 ? categories.map((cat: any) => (
                                        <div key={cat.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`cat-${cat.id}`}
                                                checked={selectedCategories.includes(cat.id)}
                                                onChange={() => handleCategoryToggle(cat.id)}
                                                className="rounded border-gray-300"
                                            />
                                            <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer">{cat.name}</Label>
                                        </div>
                                    )) : (
                                        <p className="text-muted-foreground text-sm">Nenhuma categoria encontrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
