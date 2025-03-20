const express = require("express");
const productService = require("../../service/product-service");
const fileService = require("../../service/file-service");

const upload = require("../../middleware/upload"); // Import Multer middleware
const router = express.Router();
// const authPermission = require("../../middleware/checkPermission");
// const accessURL = "http://localhost:5001/api/auths/checkPermission";
// const authMiddleWare = require("../../middleware/authenticate");
//  id            Int       @id @default(autoincrement())
//   name          String    @default("")
//   slug          String    @default("")
//   description   String    @default("")
//   short_description String @default("")
//   image_url     String @default("")
//   gallery_product  String @default("")
//   price         Float @default(0)
//   availability  Boolean   @default(false)
//   rating        Float @default(0)
//   review_count  Int       @default(0)
//   meta_title    String    @default("")
//   meta_keywords String    @default("")
//   meta_description   String    @default("")
//   userUpdate    String    @default("")
//   createDate    DateTime  @default(now())
//   updateDate    DateTime? @updatedAt
//   isDeleted     Boolean   @default(false)
//   parentId      Int       @default(0)

/**
 * @swagger
 * components:
 *   schemas:
 *      Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         short_description:
 *           type: string
 *         product_extend:
 *           type: string
 *         status:
 *           type: string
 *         image_url:
 *           type: string
 *         gallery_product:
 *           type: string
 *         price:
 *           type: number
 *           format: double
 *         availability:
 *          type: boolean
 *          default: false
 *         rating:
 *          type: number
 *          format: double
 *         review_count:
 *           type: integer
 *         meta_title:
 *           type: string
 *         meta_keywords:
 *           type: string
 *         categoryId:
 *           type: integer
 *         createDate:
 *           type: string
 *           format: date-time
 *         updateDate:
 *           type: string
 *           format: date-time
 *         isDeleted:
 *           type: boolean
 *           default: false
 *         meta_description:
 *           type: string
 *         userUpdate:
 *           type: string
 */

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The created role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post(
  "/",
  upload.fields([
    { name: "gallery_product", maxCount: 10 },
    { name: "gallery_productExtend", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const access = await authPermission.checkpermission(
        req,
        "product",
        "POST"
      );
      const accessApprove = authPermission.checkpermission(
        req,
        "product",
        "APPROVED"
      );
      if (access) {
        req.body.status = accessApprove ? req.body.status : "PENDING";
        const { slug } = req.body;
        const file = await fileService.uploadMultipleFilesAsync(
          req.files.gallery_product,
          "product_img",
          slug
        );
        req.body.gallery_product = file.fileNames;
        var productExtend = req.body.product_extend;
        if (
          !spService.isNullOrEmpty(productExtend) &&
          productExtend != "null"
        ) {
          productExtend = JSON.parse(productExtend);
          if (req.files.gallery_productExtend.length > 0) {
            const fileExtend = await fileService.uploadFilesJoinInFolderAsync(
              req.files.gallery_productExtend,
              "product_img",
              slug
            );
            productExtend.gallery_productExtend = fileExtend.fileNames;
            req.body.product_extend = JSON.stringify(productExtend);
          }
        } else {
          req.body.product_extend = "";
        }

        const product = await productService.createProduct(req.body);
        res.json(product);
      } else {
        res
          .status(500)
          .json({ message: "you cannot permission to get product" });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Get all Products with optional search and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for organization or product name
 *       - in: query
 *         name: pageCurrent
 *         schema:
 *           type: integer
 *         description: Current page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: sortList
 *         required: false
 *         schema:
 *           type: string
 *         description: |
 *           Danh sách các điều kiện sắp xếp, mỗi điều kiện được truyền dưới dạng chuỗi JSON.
 *           Ví dụ: '[{"key": "firstName", "value": "asc"}, {"key": "lastName", "value": "desc"}]'
 *       - in: query
 *         name: optionExtend
 *         required: false
 *         schema:
 *           type: string
 *         description: |
 *           Danh sách các điều kiện sắp xếp, mỗi điều kiện được truyền dưới dạng chuỗi JSON.
 *           Ví dụ: '[{"key": "firstName", "value": "asc"}, {"key": "lastName", "value": "desc"}]'
 *     responses:
 *       200:
 *         description: A list of product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 totalProduct:
 *                   type: integer
 */
router.get("/", async (req, res) => {
  try {
    const {
      search,
      pageCurrent = 1,
      pageSize = 10,
      sortList = "[]",
      optionExtend = "[]",
    } = req.query;
    const access = await authPermission.checkpermission(req, "product", "GET");
    if (access) {
      const parsedSortList = sortList ? JSON.parse(sortList) : [];
      const parsedOptionExtend = sortList ? JSON.parse(optionExtend) : [];
      const result = await productService.getProducts(
        search,
        parseInt(pageCurrent),
        parseInt(pageSize),
        parsedSortList,
        parsedOptionExtend
      );
      res.json(result);
    } else {
      res.status(500).json({ message: "you cannot permission to get product" });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: product ID
 *     responses:
 *       200:
 *         description: The product data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.get("/:id", async (req, res) => {
  try {
    const access = await authPermission.checkpermission(req, "product", "GET");
    if (access) {
      const product = await productService.getProductById(req.params.id);
      res.json(product);
    } else {
      res.status(500).json({ message: "you cannot permission to get product" });
    }
  } catch (e) {
    console.error(e);
  }
});

/**
 * @swagger
 * /api/product/categoryId/{id}:
 *   get:
 *     summary: Get product by categoryId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The ID of the parent role
 *     responses:
 *       200:
 *         description: Successfully retrieved product
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/categoryId/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);

    if (isNaN(categoryId)) {
      return res
        .status(400)
        .json({ message: "Invalid categoryId. Must be a number." });
    }

    const product = await productService.getProductByCategoryId(categoryId);
    res.json(product);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put(
  "/:id",
  upload.fields([
    { name: "gallery_product", maxCount: 10 },
    { name: "gallery_productExtend", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const access = await authPermission.checkpermission(
        req,
        "product",
        "PUT"
      );
      if (access) {
        const { slug } = req.body;
        const file = await fileService.uploadMultipleFilesAsync(
          req.files.gallery_product,
          "product_img",
          slug
        );
        req.body.gallery_product = file.fileNames;
        var productExtend = req.body.product_extend;
        if (
          !spService.isNullOrEmpty(productExtend) &&
          productExtend != "null"
        ) {
          productExtend = JSON.parse(productExtend);
          if (
            req.files.gallery_productExtend &&
            req.files.gallery_productExtend.length > 0
          ) {
            const fileExtend = await fileService.uploadFilesJoinInFolderAsync(
              req.files.gallery_productExtend,
              "product_img",
              slug
            );
            productExtend.gallery_productExtend = fileExtend.fileNames;
            req.body.product_extend = JSON.stringify(productExtend);
          }
        } else {
          req.body.product_extend = "";
        }
        const product = await productService.updateProduct(
          req.params.id,
          req.body
        );
        res.json(product);
      } else {
        res
          .status(500)
          .json({ message: "you cannot permission to get product" });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
        error: error.message,
      });
    }
  }
);
/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     summary: Soft delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: product ID
 *     responses:
 *       204:
 *         description: product deleted successfully
 */
router.delete("/:id", async (req, res) => {
  try {
    const access = await authPermission.checkpermission(
      req,
      "product",
      "DELETE"
    );
    if (access) {
      var product = await productService.deleteProduct(req.params.id);
      fileService.deleteFolder("product_img", product.slug);
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "you cannot permission to get product" });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/product/productExtend/{id}:
 *   delete:
 *     summary: Delete product extend
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productExtendId:
 *                 type: string
 *                 description: Product Extend ID to delete
 *                 example: "abc123"
 *     responses:
 *       204:
 *         description: Product deleted successfully
 */
router.delete("/productExtend/:id", async (req, res) => {
  try {
    const access = await authPermission.checkpermission(
      req,
      "product",
      "DELETE"
    );
    if (access) {
      var product = await productService.deleteProductExtend(
        req.params.id,
        req.body.productExtendId
      );

      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "you cannot permission to get product" });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/product/temp/{id}:
 *   put:
 *     summary: Delete temperary a Product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The updated Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put("/temp/:id", async (req, res) => {
  try {
    const access = await authPermission.checkpermission(req, "product", "PUT");
    if (access) {
      await productService.deleteProductTemperary(req.params.id);
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "you cannot permission to get product" });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/product/status/{id}:
 *   put:
 *     summary: Delete temperary a Product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: Product status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The updated Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put("/status/:id", async (req, res) => {
  try {
    const accessApprove = await authPermission.checkpermission(
      req,
      "product",
      "APPROVED"
    );
    console.log("adsasd", accessApprove);
    if (accessApprove) {
      await productService.updateStatus(req.params.id, req.query.status);
      res.status(204).json({ message: "you can permission to get product" });
    } else {
      res.json({
        message: "you cannot permission to get product",
        status: 500,
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/product/getCookie:
 *   put:
 *     summary: Delete temperary a Product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: The updated Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post("/getCookie", async (req, res) => {
  try {
    const getCookie = req.body.getCookie;

    res.status(200).json({
      message: "Lấy cookie thành công!",
      cookie: getCookie,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách sản phẩm.",
      error: error.message,
    });
  }
});

module.exports = router;
