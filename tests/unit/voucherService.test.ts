import { jest } from "@jest/globals";
import { Voucher } from "@prisma/client";

import voucherRepository from "../../src/repositories/voucherRepository.js";
import voucherService from "../../src/services/voucherService.js";

describe("voucherService test suite", () => {

  it("should create a voucher", async () => {
    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(undefined);
    jest.spyOn(voucherRepository, "createVoucher").mockImplementationOnce((): any => { });

    await voucherService.createVoucher('addff', 50);
    expect(voucherRepository.getVoucherByCode).toHaveBeenCalledTimes(1);
    expect(voucherRepository.createVoucher).toHaveBeenCalledTimes(1);
  });

  it("should not create a voucher", async () => {
    const voucher: Voucher = { id: 1, code: "054uf", discount: 50, used: false };
    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(voucher);

    await expect(voucherService.createVoucher(voucher.code, voucher.discount)).rejects.toEqual({
      message: "Voucher already exist.",
      type: "conflict"
    });
  });

  it("should not apply voucher - voucher does not exist.", async () => {
    const voucher: Voucher = { id: 1, code: "054uf", discount: 50, used: false };
    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(undefined);

    await expect(voucherService.applyVoucher(voucher.code, voucher.discount)).rejects.toEqual({
      message: "Voucher does not exist.",
      type: "conflict"
    });
  });

  it("should not apply voucher - voucher does not exist.", async () => {
    const voucher: Voucher = { id: 1, code: "054uf", discount: 50, used: false };
    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(undefined);

    await expect(voucherService.applyVoucher(voucher.code, 100)).rejects.toEqual({
      message: "Voucher does not exist.",
      type: "conflict"
    });
  });

  it("should not apply voucher - voucher already used", async () => {
    const voucher: Voucher = { id: 1, code: "054uf", discount: 50, used: true };

    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(voucher);

    const amount = 120;

    const result = await voucherService.applyVoucher(voucher.code, amount);

    expect(result.amount).toEqual(amount);
    expect(result.discount).toEqual(voucher.discount);
    expect(result.finalAmount).toEqual(amount);
    expect(result.applied).toBe(false);
  });

  it("should not apply voucher - amount less than minimum discount", async () => {
    const voucher: Voucher = { id: 1, code: "054uf", discount: 50, used: false };

    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(voucher);

    const amount = 90;

    const result = await voucherService.applyVoucher(voucher.code, amount);

    expect(result.amount).toEqual(amount);
    expect(result.discount).toEqual(voucher.discount);
    expect(result.finalAmount).toEqual(amount);
    expect(result.applied).toBe(false);
  });

  it("should apply voucher - 50% of discount", async () => {
    const voucher: Voucher = { id: 1, code: "054uf", discount: 50, used: false };

    jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(voucher);

    jest.spyOn(voucherRepository, "useVoucher").mockResolvedValueOnce({ ...voucher, used: true });

    const amount = 150;

    const result = await voucherService.applyVoucher(voucher.code, amount);

    expect(result.amount).toEqual(amount);
    expect(result.discount).toEqual(voucher.discount);
    expect(result.finalAmount).toEqual(amount - (voucher.discount / 100) * amount);
    expect(result.applied).toBe(true);
  });
});