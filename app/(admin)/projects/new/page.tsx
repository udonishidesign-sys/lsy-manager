"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageTitle from "@/components/ui/PageTitle";
import PageActions from "@/components/ui/PageActions";
import FormSection from "@/components/ui/FormSection";
import { Building2, ClipboardPen, JapaneseYen, FileText } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [partnerCompany, setPartnerCompany] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [centerName, setCenterName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [largeUnitPrice1, setLargeUnitPrice1] = useState("");
  const [largeUnitPrice2, setLargeUnitPrice2] = useState("");
  const [projectRule, setProjectRule] = useState("");
  const [cautionNote, setCautionNote] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const saveProject = async () => {
    if (!name.trim()) {
      alert("案件名を入力してください");
      return;
    }

    if (!unitPrice) {
      alert("通常単価を入力してください");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("projects").insert([
      {
        name,
        partner_company: partnerCompany || null,
        delivery_area: deliveryArea || null,
        center_name: centerName || null,
        address: address || null,
        phone: phone || null,
        contact_person: contactPerson || null,
        current_unit_price: Number(unitPrice),
        large_unit_price_1: Number(largeUnitPrice1 || 0),
        large_unit_price_2: Number(largeUnitPrice2 || 0),
        project_rule: projectRule || null,
        caution_note: cautionNote || null,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("案件を登録しました");
    router.push("/projects");
  };

  return (
    <main className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageTitle>案件の新規追加</PageTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-mist-200">
            <FormSection icon={<Building2 size={24} />} title="基本情報" />
            <Input
              label="案件名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="提携先企業名"
              value={partnerCompany}
              onChange={(e) => setPartnerCompany(e.target.value)}
            />
            <Input
              label="配送エリア"
              value={deliveryArea}
              onChange={(e) => setDeliveryArea(e.target.value)}
            />
            <Input
              label="センター"
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
            />
            <Input
              label="担当者"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />{" "}
            <Input
              label="住所"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="電話番号"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Card>

          <div className="space-y-4">
            <Card className="border border-mist-200">
              <FormSection icon={<JapaneseYen size={24} />} title="単価設定" />

              <Input
                label="通常単価"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />

              <Input
                label="大型①単価"
                type="number"
                value={largeUnitPrice1}
                onChange={(e) => setLargeUnitPrice1(e.target.value)}
              />

              <Input
                label="大型②単価"
                type="number"
                value={largeUnitPrice2}
                onChange={(e) => setLargeUnitPrice2(e.target.value)}
              />
            </Card>

            <Card className="border border-mist-200">
              <FormSection icon={<FileText size={24} />} title="備考" />

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  案件ルール
                </label>
                <textarea
                  value={projectRule}
                  onChange={(e) => setProjectRule(e.target.value)}
                  rows={4}
                  className="border rounded-lg w-full py-3 px-2 bg-teal-50 border-teal-500 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  注意事項
                </label>
                <textarea
                  value={cautionNote}
                  onChange={(e) => setCautionNote(e.target.value)}
                  rows={4}
                  className="border rounded-lg w-full py-3 px-2 bg-teal-50 border-teal-500 text-slate-700 outline-none"
                />
              </div>
            </Card>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Button
            onClick={saveProject}
            disabled={loading}
            showIcon
            variant="save"
          >
            {loading ? "登録中..." : "登録"}
          </Button>

          <PageActions
            actions={[
              {
                type: "back",
                href: "/projects",
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
