import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import IdModel, { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "categories",
	},
})
@pre<CategoryClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await getUserStringFromID(IdType.COMMUNITY)
		this.id = id.id
		this._id = id._id
	}
	next()
})
export class CategoryClass {
	@prop({ unique: true })
		id!: string

	@prop()
		shortdesc!: string

	@prop()
		longdesc!: string
}

const CategoryModel = getModelForClass(CategoryClass)

const watcher = CategoryModel.watch()
watcher.on("change", async (change) => {
	if (change.operationType === "delete") {
		// delete the ID from the db too
		IdModel.deleteOne({
			_id: (change.documentKey as any)._id, // guaranteed to be present when the operation is "delete"
		}).exec()
	}
})

export default CategoryModel
