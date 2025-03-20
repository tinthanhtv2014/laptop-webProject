const prismaSingleton = require("./prismaSingleton");
const { Prisma } = require("@prisma/client");
class BaseRepository {
  constructor(modelName) {
    if (!modelName) {
      throw new Error("Model name must be provided");
    }
    this.prisma = prismaSingleton.getClient();
    this.model = this.prisma[modelName];
    this.context = this.prisma[modelName];
    this.joins = [];
    this.whereClauses = [];
    this.betweenClauses = [];
    this.modelName = modelName;
  }

  joinQuery(joinModel, selectFields = []) {
    if (selectFields.length === 0) {
      const fields = this.getPropertyByModel(joinModel);
      this.joins.push({ model: joinModel, fields });
    } else {
      this.joins.push({ model: joinModel, fields: selectFields });
    }
    return this;
  }
  // Hàm lấy metadata của Prisma model
  getModelFields() {
    try {
      const model = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === this.modelName
      );
      if (!model) {
        throw new Error(
          `Model ${this.modelName} không tồn tại trong Prisma schema.`
        );
      }
      return model.fields;
    } catch (error) {
      console.error("Lỗi khi lấy metadata model:", error);
      throw new Error("Lỗi schema metadata.");
    }
  }

  // Phương thức whereQuery với kiểm tra kiểu dữ liệu
  whereQuery(keys, values) {
    if (!Array.isArray(keys) || !Array.isArray(values)) {
      throw new Error("Keys và values phải là mảng.");
    }

    if (keys.length !== values.length) {
      throw new Error("Số lượng keys và values không khớp.");
    }

    const fields = this.getModelFields();

    keys.forEach((key, index) => {
      const field = fields.find((f) => f.name === key);
      if (!field) {
        throw new Error(
          `Thuộc tính ${key} không tồn tại trong model ${this.modelName}.`
        );
      }

      const value = values[index];
      const parsedValue = this.tryParseType(value, field.type);

      if (parsedValue === null) {
        throw new Error(
          `Giá trị không hợp lệ cho trường ${key} (expected: ${field.type}).`
        );
      }

      // Kiểm tra xem key đã tồn tại trong whereClauses chưa
      const keyExists = this.whereClauses.some(
        (clause) => clause[key] !== undefined
      );
      if (keyExists) {
        // Nếu key đã tồn tại, bỏ qua không thêm vào mảng
        return;
      }

      // Thêm điều kiện vào whereClauses
      if (field.type === "String" && !Array.isArray(parsedValue)) {
        this.whereClauses.push({ [key]: { contains: parsedValue } });
      } else if (
        (field.type === "Int" || field.type === "Float") &&
        !Array.isArray(parsedValue)
      ) {
        this.whereClauses.push({ [key]: { equals: parsedValue } });
      } else if (field.type === "Boolean") {
        this.whereClauses.push({ [key]: { equals: parsedValue } });
      } else if (field.type === "DateTime") {
        this.whereClauses.push({ [key]: { equals: new Date(parsedValue) } });
      } else {
        this.whereClauses.push({ [key]: { in: parsedValue } });
      }
    });

    return this;
  }

  /**
   * Chỉ chọn các thuộc tính cụ thể từ model.
   * @param {Array<string>} keys - Danh sách các thuộc tính cần lấy.
   */
  newMap(keys) {
    if (!Array.isArray(keys)) {
      throw new Error("Keys phải là một mảng.");
    }
    this.selectedFields = keys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    return this;
  }

  /**
   * Xác định số lượng kết quả cần lấy.
   * @param {number} count - Số lượng kết quả cần lấy.
   */
  takeCount(count) {
    if (typeof count !== "number" || count < 0) {
      throw new Error("Count phải là một số dương.");
    }
    this.limit = count;
    return this;
  }

  /**
   * Xác định số lượng kết quả cần bỏ qua.
   * @param {number} count - Số lượng kết quả cần bỏ qua.
   */
  skipCount(count) {
    if (typeof count !== "number" || count < 0) {
      throw new Error("Count phải là một số dương.");
    }
    this.offset = count;
    return this;
  }
  // Phương thức betweenQuery với kiểm tra kiểu dữ liệu
  betweenQuery(ranges) {
    if (!Array.isArray(ranges)) {
      throw new Error("Ranges phải là một mảng các object.");
    }

    const fields = this.getModelFields();

    ranges.forEach((range) => {
      const { key, from, to } = range;
      if (!key || from === undefined || to === undefined) {
        throw new Error("Mỗi range phải có key, from và to.");
      }

      const field = fields.find((f) => f.name === key);
      if (!field) {
        throw new Error(
          `Thuộc tính ${key} không tồn tại trong model ${this.modelName}.`
        );
      }

      const parsedFrom = this.tryParseType(from, field.type);
      const parsedTo = this.tryParseType(to, field.type);

      if (parsedFrom === null || parsedTo === null) {
        throw new Error(
          `Giá trị không hợp lệ cho trường ${key} (expected: ${field.type}).`
        );
      }

      // Kiểm tra nếu key đã tồn tại trong betweenClauses
      const keyExists = this.betweenClauses.some(
        (clause) => clause[key] !== undefined
      );
      if (keyExists) {
        // Nếu key đã tồn tại, bỏ qua việc thêm mới
        return;
      }

      // Thêm điều kiện vào betweenClauses
      if (field.type === "DateTime") {
        this.betweenClauses.push({
          [key]: {
            gte: new Date(parsedFrom),
            lte: new Date(parsedTo),
          },
        });
      } else if (field.type === "Int" || field.type === "Float") {
        this.betweenClauses.push({
          [key]: {
            gte: parsedFrom,
            lte: parsedTo,
          },
        });
      } else {
        throw new Error(`Không thể tạo điều kiện giữa cho kiểu ${field.type}.`);
      }
    });

    return this;
  }

  // deepWhereQuery(relationKeys, searchKeys, searchValues) {
  //   if (!Array.isArray(relationKeys) || !Array.isArray(searchKeys) || !Array.isArray(searchValues)) {
  //     throw new Error("relationKeys, searchKeys và searchValues phải là mảng.");
  //   }

  //   if (searchKeys.length !== searchValues.length) {
  //     throw new Error("Số lượng searchKeys và searchValues không khớp.");
  //   }

  //   const fields = this.getModelFields();

  //   // Kiểm tra relationKeys là hợp lệ
  //   relationKeys.forEach((relation) => {
  //     const relationField = fields.find((f) => f.name === relation);
  //     if (!relationField || relationField.kind !== "object") {
  //       throw new Error(`Thuộc tính ${relation} không phải là quan hệ hợp lệ trong model ${this.modelName}.`);
  //     }
  //   });

  //   // Tạo điều kiện tìm kiếm
  //   const conditions = searchKeys.reduce((acc, key, index) => {
  //     acc[key] = searchValues[index]; // Sử dụng giá trị trực tiếp cho điều kiện
  //     return acc;
  //   }, {});

  //   // Tạo điều kiện lồng ghép từ relationKeys
  //   const relationConditions = relationKeys.reverse().reduce((acc, relation) => {
  //     return { [relation]: acc ? { is: acc } : conditions };
  //   }, null);

  //   this.whereClauses.push(relationConditions);

  //   return this;
  // }

  // Hàm build query cuối cùng

  // Truy vấn điều kiện sâu cấp 1 cấp 2 cấp 3  cấp 2 cấp 3 không nên dùng
  deepWhereQuery(relationKeys, searchKeys, searchValues) {
    if (
      !Array.isArray(relationKeys) ||
      !Array.isArray(searchKeys) ||
      !Array.isArray(searchValues)
    ) {
      throw new Error("relationKeys, searchKeys và searchValues phải là mảng.");
    }

    if (searchKeys.length !== searchValues.length) {
      throw new Error("Số lượng searchKeys và searchValues không khớp.");
    }

    const fields = this.getModelFields();

    // Kiểm tra relationKeys có hợp lệ hay không
    relationKeys.forEach((relation) => {
      const relationField = fields.find((f) => f.name === relation);
      if (!relationField || relationField.kind !== "object") {
        throw new Error(
          `Thuộc tính ${relation} không phải là quan hệ hợp lệ trong model ${this.modelName}.`
        );
      }
    });

    // Tạo điều kiện tìm kiếm từ searchKeys và searchValues
    const conditions = searchKeys.reduce((acc, key, index) => {
      acc[key] = searchValues[index]; // Tạo điều kiện tìm kiếm
      return acc;
    }, {});

    // Tạo điều kiện cho các quan hệ
    const relationConditions = relationKeys.reduceRight(
      (acc, relation, index) => {
        const isArrayRelation = Array.isArray(acc);

        if (index === relationKeys.length - 1) {
          // Kiểm tra nếu quan hệ cuối cùng là mảng
          if (isArrayRelation) {
            return { [relation]: { some: conditions } };
          } else {
            return { [relation]: conditions }; // Nếu không phải mảng, áp dụng điều kiện trực tiếp
          }
        } else {
          // Nếu không phải mối quan hệ cuối, tiếp tục lồng ghép điều kiện
          return { [relation]: acc || conditions };
        }
      },
      conditions
    );

    // Thêm điều kiện vào whereClauses
    this.whereClauses.push(relationConditions);

    return this;
  }

  buildQuery() {
    return {
      where: {
        AND: [...this.whereClauses, ...this.betweenClauses],
      },
    };
  }

  getPropertyByModel(newModel) {
    try {
      const modelName = newModel || this.modelName;
      const model = Prisma.dmmf.datamodel.models.find(
        (p) => p.name === modelName
      );
      if (!model) {
        throw new Error(`Model ${modelName} not found in Prisma schema`);
      }
      return model.fields.map((field) => field.name);
    } catch (error) {
      console.error("Error retrieving model properties:", error);
      throw new Error("Schema metadata error");
    }
  }

  getModels(modelName, fieldsToSelect = []) {
    try {
      const model = Prisma.dmmf.datamodel.models.find(
        (p) => p.name === modelName
      );
      if (!model) {
        throw new Error(`Model ${modelName} not found in Prisma schema`);
      }

      // Nếu không có trường nào được chỉ định, lấy tất cả các trường
      if (fieldsToSelect.length === 0) {
        const selectFields = {};
        model.fields.forEach((field) => {
          selectFields[field.name] = true;
        });
        return selectFields;
      }

      // Chỉ lấy các trường được chỉ định
      const selectFields = {};
      fieldsToSelect.forEach((field) => {
        if (model.fields.some((f) => f.name === field)) {
          selectFields[field] = true;
        }
      });
      return selectFields;
    } catch (error) {
      console.error("Error retrieving select fields:", error);
      throw new Error("Schema metadata error");
    }
  }

  async autoMapWithModel(input) {
    try {
      const mappedData = {};
      const fields = Prisma.dmmf.datamodel.models.find(
        (p) => p.name === this.modelName
      )?.fields;

      if (!fields) {
        throw new Error(`Model ${this.modelName} not found in Prisma schema`);
      }

      for (const field of fields) {
        const fieldName = field.name;
        const isRequired = field.isRequired; // Trường không cho phép null
        const isRelation = !!field.relationName; // Trường là mối quan hệ
        const fieldType = field.type;
        const isPrimaryKey = field.isId; // Trường khoá chính
        const isAutoIncrement = field.isAutoIncrement; // Trường tự tăng

        const inputValue = input[fieldName];

        // Nếu là quan hệ và không có input, bỏ qua nếu là update
        if (isRelation || isPrimaryKey || isAutoIncrement) {
          continue;
        }

        // Nếu giá trị là undefined hoặc null
        if (inputValue === undefined || inputValue === null) {
          if (isRequired) {
            const defaultValue = this.getDefaultValue(fieldType); // Lấy giá trị mặc định nếu có
            mappedData[fieldName] = defaultValue;
            continue;
          }
        }

        // Nếu không phải quan hệ, thử parse kiểu dữ liệu
        const parsedValue = this.tryParseType(inputValue, fieldType);
        if (parsedValue === null) {
          throw new Error(
            `Field ${fieldName} should be of type ${fieldType}, but got invalid value: ${inputValue}`
          );
        }

        // Gán giá trị sau khi parse
        mappedData[fieldName] = parsedValue;
      }

      return mappedData;
    } catch (error) {
      console.error("Error in autoMap:", error);
      throw new Error("Mapping error");
    }
  }
  autoMapWithModel(input) {
    try {
      const mappedData = {};
      const fields = Prisma.dmmf.datamodel.models.find(
        (p) => p.name === this.modelName
      )?.fields;

      if (!fields) {
        throw new Error(`Model ${this.modelName} not found in Prisma schema`);
      }

      for (const field of fields) {
        const fieldName = field.name;
        const isRequired = field.isRequired; // Trường không cho phép null
        const isRelation = !!field.relationName; // Trường là mối quan hệ
        const fieldType = field.type;
        const isPrimaryKey = field.isId; // Trường khoá chính
        const isAutoIncrement = field.isAutoIncrement; // Trường tự tăng

        const inputValue = input[fieldName];

        // Nếu là quan hệ và không có input, bỏ qua nếu là update
        if (isRelation || isPrimaryKey || isAutoIncrement) {
          continue;
        }

        // Nếu giá trị là undefined hoặc null
        if (inputValue === undefined || inputValue === null) {
          if (isRequired) {
            const defaultValue = this.getDefaultValue(fieldType); // Lấy giá trị mặc định nếu có
            mappedData[fieldName] = defaultValue;
            continue;
          }
        }

        // Nếu không phải quan hệ, thử parse kiểu dữ liệu
        const parsedValue = this.tryParseType(inputValue, fieldType);
        if (parsedValue === null) {
          throw new Error(
            `Field ${fieldName} should be of type ${fieldType}, but got invalid value: ${inputValue}`
          );
        }

        // Gán giá trị sau khi parse
        mappedData[fieldName] = parsedValue;
      }

      return mappedData;
    } catch (error) {
      console.error("Error in autoMap:", error);
      throw new Error("Mapping error");
    }
  }
  getDefaultValue(fieldType) {
    switch (fieldType) {
      case "String":
        return "";
      case "Boolean":
        return false;
      case "Int":
        return 0;
      case "DateTime":
        return new Date();
      // Thêm các kiểu dữ liệu khác nếu cần
      default:
        return null;
    }
  }
  // Hàm thử parse giá trị theo kiểu dữ liệu
  tryParseType(value, expectedType) {
    switch (expectedType) {
      case "String":
        return String(value);
      case "Int":
        if (Number.isInteger(Number(value))) {
          return Number(value);
        }
        return value; // Không parse được kiểu số nguyên
      case "Float":
        if (!isNaN(parseFloat(value))) {
          return parseFloat(value);
        }
        return value; // Không parse được kiểu số thực
      case "Boolean":
        if (value === "true" || value === true) return true;
        if (value === "false" || value === false) return false;
        return value; // Không parse được kiểu boolean
      case "DateTime": {
        // const date = new Date(value);
        // if (!isNaN(date.getTime())) {
        //   return date;
        return value;
      }
      default:
        // Các loại dữ liệu khác hoặc kiểu tùy chỉnh
        return value;
    }
  }

  reneRateInputFilter(
    search,
    searchKey = [],
    pageCurrent = 1,
    pageSize = 10,
    sortList = [],
    where = null,
    includeRelations = {},
    orderBy = []
  ) {
    return {
      searchValue: search,
      searchKey: searchKey,
      pageCurrent: pageCurrent,
      pageSize: pageSize,
      sortList: sortList,
      where: where,
      includeRelations: includeRelations,
      orderBy: orderBy,
    };
  }
  // Bất đồng bộ khi dùng phải nhớ await
  // async toListAsync(inputFilter) {
  //   const {
  //     searchValue,
  //     searchKey,
  //     pageCurrent,
  //     pageSize,
  //     sortList,
  //     where,
  //     includeRelations,
  //     orderBy = [],
  //   } = inputFilter;
  //   const validSortList = Array.isArray(sortList) ? sortList : [];
  //   const skip = this.offset || (pageCurrent - 1) * pageSize;
  //   const take = this.limit || pageSize;

  //   try {
  //     const whereClause = {
  //       AND: [
  //         ...(searchValue && searchKey.length > 0
  //           ? [
  //             {
  //               OR: searchKey.map((key) => ({
  //                 [key]: { contains: searchValue },
  //               })),
  //             },
  //           ]
  //           : []),
  //         ...(where ? [where] : []),
  //         ...this.whereClauses,
  //         ...this.betweenClauses,
  //         ...validSortList.map((filter) => {
  //           if (typeof filter.value === "string") {
  //             return {
  //               [filter.key]: {
  //                 contains: filter.value,
  //               },
  //             };
  //           } else if (typeof filter.value === "number") {
  //             return {
  //               [filter.key]: {
  //                 equals: filter.value,
  //               },
  //             };
  //           } else if (Array.isArray(filter.value)) {
  //             return {
  //               [filter.key]: {
  //                 in: filter.value,
  //               },
  //             };
  //           }
  //           return {};
  //         }),
  //       ],
  //     };

  //     let includeObj = {};
  //     for (const join of this.joins) {
  //       includeObj[join.model] = {
  //         select: join.fields,
  //       };
  //     }

  //     // Sử dụng `include` nếu có liên kết, hoặc `select` nếu cần lọc trường
  //     const queryOptions = {
  //       where: whereClause,
  //       skip,
  //       take,
  //       orderBy,
  //     };

  //     if (Object.keys(includeRelations).length || Object.keys(includeObj).length) {
  //       queryOptions.include = { ...includeRelations, ...includeObj };
  //     } else {
  //       queryOptions.select = this.selectedFields ; // Thêm các trường khác bạn muốn
  //     }

  //     const listData = await this.model.findMany(queryOptions);
  //     const total = await this.model.count({ where: whereClause });

  //     this.joins = [];
  //     this.whereClauses = [];
  //     this.betweenClauses = [];
  //     this.selectedFields = undefined;
  //     this.limit = undefined;
  //     this.offset = undefined;
  //     return { listData, total };
  //   } catch (error) {
  //     console.error("Error fetching records:", error);
  //     throw new Error("Service error");
  //   }
  // }
  async toListAsync(inputFilter = {}) {
    const {
      searchValue = null,
      searchKey = [],
      pageCurrent = 1,
      pageSize = 1000,
      sortList = [],
      where = [],
      includeRelations = {},
      orderBy = [],
    } = inputFilter;

    const validSortList = Array.isArray(sortList) ? sortList : [];
    const skip = this.offset || (pageCurrent - 1) * pageSize;
    const take = this.limit || pageSize;

    try {
      const whereClause = {
        AND: [
          ...(searchValue && searchKey.length > 0
            ? [
                {
                  OR: searchKey.map((key) => ({
                    [key]: { contains: searchValue },
                  })),
                },
              ]
            : []),
          ...(where && where.length > 0 ? [...where] : []),
          ...this.whereClauses,
          ...this.betweenClauses,
          ...validSortList.map((filter) => {
            if (typeof filter.value === "string") {
              return {
                [filter.key]: {
                  contains: filter.value,
                },
              };
            } else if (typeof filter.value === "number") {
              return {
                [filter.key]: {
                  equals: filter.value,
                },
              };
            } else if (Array.isArray(filter.value)) {
              return {
                [filter.key]: {
                  in: filter.value,
                },
              };
            }
            return {};
          }),
        ].filter(Boolean),
      };

      let includeObj = {};
      for (const join of this.joins) {
        includeObj[join.model] = {
          select: join.fields,
        };
      }

      // Xử lý queryOptions
      const queryOptions = {
        where: whereClause,
        orderBy,
        skip,
        take,
      };
      if (this.selectedFields) {
        queryOptions.select = {
          ...this.selectedFields,
          ...(Object.keys(includeObj).length ? includeObj : {}),
        };
      } else {
        queryOptions.include = {
          ...includeRelations,
          ...includeObj,
        };
      }
      const listData = await this.model.findMany(queryOptions);
      const total = await this.model.count({ where: whereClause });

      // Reset trạng thái
      this.joins = [];
      this.whereClauses = [];
      this.betweenClauses = [];
      this.selectedFields = undefined;
      this.limit = undefined;
      this.offset = undefined;

      return { listData, total };
    } catch (error) {
      console.error("Error fetching records:", error);
      throw new Error("Service error");
    }
  }

  async toFirstAsync() {
    try {
      const whereClause = {
        AND: [...this.whereClauses, ...this.betweenClauses],
      };

      let includeObj = {};
      for (const join of this.joins) {
        includeObj[join.model] = {
          select: join.fields,
        };
      }
      const responsive = await this.model.findFirst({
        where: whereClause,
        include: includeObj,
      });
      this.joins = [];
      this.whereClauses = [];
      this.betweenClauses = [];
      return responsive;
    } catch (error) {
      console.error("Error fetching records:", error);
      throw new Error("Service error");
    }
  }
  async firstOrDefautAsync(input) {
    try {
      let includeObj = {};
      for (const join of this.joins) {
        includeObj[join.model] = {
          select: join.fields,
        };
      }
      return await this.model.findFirst({
        where: input,
        include: includeObj,
      });
    } catch (error) {
      console.error("Error fetching records:", error);
      throw new Error("Service error");
    }
  }
  async createAsync(data, onlyOne = []) {
    try {
      if (onlyOne.length > 0) {
        const where = onlyOne.reduce((acc, key) => {
          acc[key] = data[key];
          return acc;
        }, {});
        const existingRecord = await this.model.findFirst({ where });
        if (existingRecord) {
          return {
            statusCode: 400,
            message: "Duplicate record exists",
          };
        }
      }

      return await this.model.create({ data });
    } catch (error) {
      console.error("Error creating record:", error);
      throw new Error("Service error");
    }
  }

  async getListAsync(
    search,
    searchKey = [],
    pageCurrent = 1,
    pageSize = 10,
    sortList = []
  ) {
    const validSortList = Array.isArray(sortList) ? sortList : [];
    try {
      const skip = (pageCurrent - 1) * pageSize;

      // Điều kiện where
      const where = {
        AND: [
          ...(search && searchKey.length > 0
            ? [
                {
                  OR: searchKey.map((key) => ({
                    [key]: { contains: search },
                  })),
                },
              ]
            : []),
          ...validSortList.map((filter) => {
            if (typeof filter.value === "string") {
              return {
                [filter.key]: {
                  contains: filter.value, // Dùng contains nếu là chuỗi
                },
              };
            } else if (typeof filter.value === "number") {
              return {
                [filter.key]: {
                  equals: filter.value, // Dùng equals nếu là số
                },
              };
            } else if (Array.isArray(filter.value)) {
              return {
                [filter.key]: {
                  in: filter.value, // Dùng in nếu là mảng
                },
              };
            }
            return {}; // Trả về đối tượng rỗng nếu không có giá trị hợp lệ
          }),
        ],
      };

      // Fetch dữ liệu từ Prisma
      const listData = await this.model.findMany({
        where,
        skip,
        take: pageSize,
      });

      // Đếm tổng số lượng bản ghi
      const total = await this.model.count({ where });

      return { listData, total };
    } catch (error) {
      console.error("Error fetching records:", error);
      throw new Error("Service error");
    }
  }

  async getListByFilterAsync(inputFilter) {
    const {
      searchValue = "",
      searchKey = "",
      pageCurrent = 1,
      pageSize = 10,
      sortList = [],
      where,
      includeRelations = [],
      orderBy = [],
    } = inputFilter;
    const validSortList = Array.isArray(sortList) ? sortList : [];

    try {
      const skip = (pageCurrent - 1) * pageSize;
      
      // Xây dựng điều kiện where dựa trên searchKey và searchValue
      const whereClause = {
        AND: [
          { isDeleted: false },
          ...(searchValue && searchKey.length > 0
            ? [
                {
                  OR: searchKey.map((key) => ({
                    [key]: { contains: searchValue },
                  })),
                },
              ]
            : []),
          ...(where ? [where] : []),
          ...validSortList.map((filter) => {
            if (typeof filter.value === "string") {
              return {
                [filter.key]: {
                  contains: filter.value,
                },
              };
            } else if (typeof filter.value === "number") {
              return {
                [filter.key]: {
                  equals: filter.value,
                },
              };
            } else if (Array.isArray(filter.value)) {
              return {
                [filter.key]: {
                  in: filter.value,
                },
              };
            }
            return {};
          }),
        ],
      };

      // Xử lý các join
      let includeObj = {};
      for (const join of this.joins) {
        includeObj[join.model] = {
          select: join.fields,
        };
      }
      const listData = await this.model.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy,
        include: includeObj,
      });

      // Đếm tổng số lượng bản ghi
      const total = await this.model.count({ where: whereClause });
      this.joins = [];
      this.whereClauses = [];
      this.betweenClauses = [];
      this.selectedFields = undefined;
      this.limit = undefined;
      this.offset = undefined;
      return { listData, total };
    } catch (error) {
      console.error("Error fetching records:", error);
      throw new Error("Service error");
    }
  }

  async updateAsync(id, data) {
    try {
      return await this.model.update({
        where: { id: parseInt(id) },
        data,
      });
    } catch (error) {
      console.error("Error updating record:", error);
      throw new Error("Service error");
    }
  }

  async deleteAsync(id) {
    try {
      return await this.model.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      console.error("Error deleting record:", error);
      throw new Error("Service error");
    }
  }

  async softDeleteAsync(id) {
    try {
      return await this.model.update({
        where: { id: parseInt(id) },
        data: { isDeleted: true },
      });
    } catch (error) {
      console.error("Error soft deleting record:", error);
      throw new Error("Service error");
    }
  }

  async createManyRelationAsync(
    relationModel,
    sourceId,
    targetIds,
    sourceKey,
    targetKey
  ) {
    try {
      await this.deleteManyRelationAsync(relationModel, sourceId, sourceKey);

      // Bước 3: Tạo các quan hệ mới
      const relations = targetIds.map((targetId) => ({
        [sourceKey]: sourceId,
        [targetKey]: targetId,
      }));

      await this.prisma[relationModel].createMany({
        data: relations,
      });

      return { success: true };
    } catch (error) {
      console.error("Error creating many-to-many relation:", error);
      throw new Error("Relation creation failed");
    }
  }
  async deleteManyRelationAsync(relationModel, sourceId, sourceKey) {
    try {
      // Bước 1: Kiểm tra sự tồn tại của các quan hệ cũ
      const existingRelations = await this.prisma[relationModel].findMany({
        where: {
          [sourceKey]: sourceId,
        },
      });

      // Bước 2: Nếu các quan hệ đã tồn tại, xoá các quan hệ cũ
      if (existingRelations.length > 0) {
        await this.prisma[relationModel].deleteMany({
          where: {
            [sourceKey]: sourceId,
          },
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Error creating many-to-many relation:", error);
      throw new Error("Relation creation failed");
    }
  }

  // Hàm chuyển kiểu dữ liệu từ Prisma sang Swagger
  mapPrismaTypeToSwaggerType(prismaType) {
    switch (prismaType) {
      case "String":
        return "string";
      case "Int":
      case "Float":
        return "number";
      case "Boolean":
        return "boolean";
      case "DateTime":
        return "string"; // Dạng ISO8601
      default:
        return "string"; // Kiểu mặc định
    }
  }

  // Hàm render Swagger schema cho model từ Prisma
  renderSwagger() {
    const modelFields = this.getModelFields();

    const requiredFields = [];
    const properties = {};

    modelFields.forEach((field) => {
      if (field.isRequired) {
        requiredFields.push(field.name);
      }

      properties[field.name] = {
        type: this.mapPrismaTypeToSwaggerType(field.type),
        description: field.documentation || `Description for ${field.name}`,
      };
    });

    // Tạo Swagger schema cho model
    const schema = {
      type: "object",
      required: requiredFields,
      properties,
    };

    return `
/**
 * @swagger
 * components:
 *   schemas:
 *     ${this.modelName}:
 *       type: object
 *       required: ${JSON.stringify(requiredFields)}
 *       properties: ${JSON.stringify(properties)}
 */

/**
 * @swagger
 * /api/${this.modelName.toLowerCase()}s:
 *   post:
 *     summary: Create a new ${this.modelName}
 *     tags: [${this.modelName}s]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${this.modelName}'
 *     responses:
 *       201:
 *         description: The created ${this.modelName}
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/${this.modelName}'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/${this.modelName.toLowerCase()}s:
 *   get:
 *     summary: Get all ${this.modelName}s
 *     tags: [${this.modelName}s]
 *     responses:
 *       200:
 *         description: A list of ${this.modelName}s
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/${this.modelName}'
 */

/**
 * @swagger
 * /api/${this.modelName.toLowerCase()}s/{${this.modelName.toLowerCase()}Id}:
 *   get:
 *     summary: Get a ${this.modelName} by ID
 *     tags: [${this.modelName}s]
 *     parameters:
 *       - in: path
 *         name: ${this.modelName.toLowerCase()}Id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ${this.modelName} ID
 *     responses:
 *       200:
 *         description: The ${this.modelName} data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/${this.modelName}'
 *       404:
 *         description: ${this.modelName} not found
 */

/**
 * @swagger
 * /api/${this.modelName.toLowerCase()}s/{${this.modelName.toLowerCase()}Id}:
 *   put:
 *     summary: Update a ${this.modelName} by ID
 *     tags: [${this.modelName}s]
 *     parameters:
 *       - in: path
 *         name: ${this.modelName.toLowerCase()}Id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ${this.modelName} ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${this.modelName}'
 *     responses:
 *       200:
 *         description: The updated ${this.modelName}
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/${this.modelName}'
 *       400:
 *         description: Invalid input or ${this.modelName} not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/${this.modelName.toLowerCase()}s/soft/{${this.modelName.toLowerCase()}Id}:
 *   delete:
 *     summary: Soft delete a ${this.modelName}
 *     tags: [${this.modelName}s]
 *     parameters:
 *       - in: path
 *         name: ${this.modelName.toLowerCase()}Id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ${this.modelName} ID
 *     responses:
 *       200:
 *         description: ${this.modelName} soft-deleted successfully
 */

/**
 * @swagger
 * /api/${this.modelName.toLowerCase()}s/hard/{${this.modelName.toLowerCase()}Id}:
 *   delete:
 *     summary: Permanently delete a ${this.modelName}
 *     tags: [${this.modelName}s]
 *     parameters:
 *       - in: path
 *         name: ${this.modelName.toLowerCase()}Id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ${this.modelName} ID
 *     responses:
 *       200:
 *         description: ${this.modelName} permanently deleted
 */
    `;
  }
  renderSwaggerTest() {
    const modelFields = this.getModelFields();
    const requiredFields = [];
    const properties = {};

    modelFields.forEach((field) => {
      if (field.isRequired) {
        requiredFields.push(field.name);
      }

      properties[field.name] = {
        type: this.mapPrismaTypeToSwaggerType(field.type),
        description: field.documentation || `Description for ${field.name}`,
      };
    });

    // Tạo Swagger schema cho model
    const schema = {
      type: "object",
      required: requiredFields,
      properties,
    };

    return `/**
 * @swagger
 * components:
 *   schemas:
 *     ${this.modelName}:
 *       type: object
 *       required: ${JSON.stringify(requiredFields)}
 *       properties: ${JSON.stringify(properties)}
 */
`;
  }

  // async createWithRelations(key, inputRelations) {
  //   const modelFields = Prisma.dmmf.datamodel.models.find(
  //     (p) => p.name === this.modelName
  //   )?.fields;
  //   modelFields.find((f) => f.name == key);

  //   modelFields.find((f) => f.name == key);
  //   const newRecord = await this.create(mappedData);

  //   // Xử lý các mối quan hệ
  //   for (const [relation, ids] of Object.entries(relations)) {
  //     await this.createManyRelation(
  //       relation,
  //       newRecord.id,
  //       ids,
  //       `${this.modelName}_id`,
  //       `${relation}_id`
  //     );
  //   }

  //   return newRecord;
  // }
  // async autoMapWithRelations(input) {
  //   const mappedData = await this.autoMapWithModel(input);
  //   const relations = {};

  //   const modelFields = Prisma.dmmf.datamodel.models.find(
  //     (p) => p.name === this.modelName
  //   )?.fields;

  //   modelFields.forEach((field) => {
  //     if (field.relationName) {
  //       console.log(input[field.name]);
  //     }
  //     if (field.relationName && Array.isArray(input[field.name])) {
  //       relations[field.relationName] = input[field.name];
  //     }
  //   });

  //   return { mappedData, relations };
  // }

  // async createDynamicRelation(relationName, sourceId, targetIds) {
  //   const relationModel = Prisma.dmmf.datamodel.models.find(
  //     (m) => m.name === relationName
  //   );
  //   if (!relationModel) throw new Error(`Relation ${relationName} not found`);

  //   const sourceKey = relationModel.fields.find((f) =>
  //     f.relationFromFields.includes(this.modelName.toLowerCase())
  //   )?.name;
  //   const targetKey = relationModel.fields.find((f) =>
  //     f.relationFromFields.includes(relationName.toLowerCase())
  //   )?.name;

  //   return this.createManyRelation(
  //     relationName,
  //     sourceId,
  //     targetIds,
  //     sourceKey,
  //     targetKey
  //   );
  // }
}

module.exports = BaseRepository;
