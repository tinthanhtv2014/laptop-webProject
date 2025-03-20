const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const BaseRepository = require("../IResponsitory/responsivetory");
const _baseRepository = new BaseRepository("Product");
const _fileService = require("./file-service");

// Create a new role
async function createProduct(Product) {
  let input = _baseRepository.getModels("Product");
  input = _baseRepository.autoMapWithModel(Product);
  const checkValid = ["slug"];
  return await _baseRepository.createAsync(input, checkValid);
}

// Get all roles with optional search and pagination
async function getProducts(
  search,
  pageCurrent,
  pageSize,
  sortList = [],
  optionExtend = []
) {
  const filter = _baseRepository.reneRateInputFilter();
  filter.searchValue = search;
  filter.searchKey = ["name", "slug"];
  filter.pageSize = pageSize;
  filter.sortList = sortList;
  filter.pageCurrent = pageCurrent;
  filter.orderBy = [{ updateDate: "desc" }];
  const categoryDto = _baseRepository.getModels("Category", [
    "id",
    "name",
    "slug",
  ]);
  let products = await _baseRepository
    .joinQuery("category", categoryDto)
    .toListAsync(filter);

  if (optionExtend.length > 0) {
    const tenantId = optionExtend.find((x) => x.key == "tenantId").value;
    if (tenantId != 0 && products.listData.length > 0) {
      const listsortListProductDetails = [
        {
          key: "productId",
          value: products.listData.map((x) => x.id),
        },
      ];

      const listProductDetails = await _productDetailsService.getProductDetails(
        null,
        1,
        pageSize,
        listsortListProductDetails,
        optionExtend
      );

      // Duyệt qua danh sách sản phẩm và thêm `isValid` dựa trên `listProductDetails`
      const productIdsInDetails = new Set(
        listProductDetails.listData.map((detail) => detail.productId)
      );

      products.listData = products.listData.map((product) => ({
        ...product,
        isValid: productIdsInDetails.has(product.id),
      }));
    }
  }

  return {
    products: products.listData,
    totalProduct: products.total,
  };
}

// Get a role by ID
async function getProductById(id) {
  return await _baseRepository.firstOrDefautAsync({
    id: parseInt(id),
    isDeleted: false,
  });
}
// lấy danh sách bật cao nhất parent
async function getProductByCategoryId(categoryId) {
  const product = await prisma.product.findMany({
    where: { categoryId: parseInt(categoryId), isDeleted: false },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      short_description: true,
      image_url: true,
      gallery_product: true,
      product_extend: true,
      status: true,
      price: true,
      availability: true,
      rating: true,
      review_count: true,
      meta_title: true,
      meta_keywords: true,
      meta_description: true,
      userUpdate: true,
      updateDate: true,
      createDate: true,
      isDeleted: true,
      categoryId: true,
      category: true,
    },
  });

  return product;
}
// Update a role
async function updateProduct(id, product) {
  const updateInput = await _baseRepository.autoMapWithModel(product);
  const productExist = await _baseRepository.firstOrDefautAsync({
    id: parseInt(id),
  });
  if (productExist.slug !== updateInput.slug) {
    _fileService.deleteFolder("product_img", productExist.slug);
  }
  const productUpdate = await _baseRepository.updateAsync(id, updateInput);

  if (productUpdate) {
    const updatedProductDetails = await prisma.product_details.updateMany({
      where: {
        productId: productUpdate.id,
      },
      data: {
        categoryId: updateInput.categoryId,
      },
    });
  }

  return productUpdate;
}

async function deleteProduct(id) {
  const findProductDetails = await prisma.product.findFirst({
    where: { id: parseInt(id) },
  });
  await prisma.product.delete({
    where: { id: parseInt(id) },
  });
  _fileService.deleteFolder("product_img", findProductDetails.slug);
  return findProductDetails;
}

async function deleteProductTemperary(id) {
  try {
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
}

// hàm cập nhật
async function updateStatus(id, status) {
  try {
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        status: status,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
}

//xóa product extend
async function deleteProductExtend(id, productExtendId) {
  try {
    const productExtend = await prisma.product.findFirst({
      where: { id: parseInt(id) },
      select: {
        product_extend: true,
      },
    });
    if (
      productExtend.product_extend &&
      productExtend.product_extend.productListExtend
    ) {
      productExtend.product_extend.productListExtend =
        productExtend.product_extend.productListExtend.filter(
          (x) => x.extend.id !== productExtendId
        );
    }

    const productExtendDetail = await prisma.product_details.findMany({
      where: { productId: parseInt(id) },
      select: {
        product_extend: true,
      },
    });
    const updatedData = productExtendDetail.map((product) => ({
      ...product,
      product_extend: product.product_extend.filter(
        (ext) => ext.extend.id !== productExtendId
      ),
    }));

    await prisma.wishlist.deleteMany({
      where: {
        product_details_extend_id: productExtendId, // Thay productDetailsId bằng giá trị cần xóa
      },
    });

    return productExtend;
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  //   getCategoryByParentId,
  getProductByCategoryId,
  deleteProductTemperary,
  updateStatus,
  deleteProductExtend,
};
